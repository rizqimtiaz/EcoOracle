// =============================================================================
// Autonomous Oracle Service
// -----------------------------------------------------------------------------
// Bridges the AI Vision Engine to the simulated blockchain. For each parcel:
//
//   1. Run the vision pipeline -> get a SatelliteScanReport
//   2. Translate the report into an on-chain state mutation
//      - Healthy growth -> mint additional credits, raise price slightly
//      - Stress / partial loss -> burn proportional credits, drop price
//      - Fire / heavy deforestation -> invalidate the dNFT entirely
//      - Regeneration -> slowly re-issue credits if status was invalidated
//   3. Append a SCAN event so the audit trail is complete
//
// This module is the heart of "Autonomous Oracles" in the EcoOracle pitch.
// In production this would be a Chainlink Functions / DON node, but here it
// runs in-process so the demo is fully self-contained.
// =============================================================================

import { analyzeParcel, ScanEvent } from "./ai-vision";
import {
  chainInvalidate,
  chainOracleUpdate,
  tonnesToCredits,
} from "./chain";
import {
  CarbonParcel,
  NetworkState,
  OracleEvent,
  ParcelStatus,
  SatelliteScanReport,
} from "./types";

interface OracleResult {
  parcelId: string;
  scan: SatelliteScanReport;
  events: OracleEvent[];
  /** True if the dNFT credits were materially changed on-chain. */
  mutated: boolean;
}

interface RunArgs {
  state: NetworkState;
  parcel: CarbonParcel;
  /** Optional forced event used by the live analyze page. */
  forcedEvent?: ScanEvent;
}

export function runOracleOnce({
  state,
  parcel,
  forcedEvent,
}: RunArgs): OracleResult {
  const scan = analyzeParcel({ parcel, event: forcedEvent });

  // Always append the scan to the parcel history.
  parcel.scanHistory.unshift(scan);
  if (parcel.scanHistory.length > 60) parcel.scanHistory.length = 60;
  parcel.lastScan = scan;

  const events: OracleEvent[] = [];
  let mutated = false;

  // Translate scan -> chain action.
  const targetTonnes = scan.estimatedTonnesCO2;
  const targetCredits = tonnesToCredits(targetTonnes);
  const currentCredits = parcel.creditsOutstanding;
  const creditsDelta = targetCredits - currentCredits;

  // Basic price model: track health & scarcity.
  // Healthy parcels with verified gains command a premium; degraded parcels
  // see prices fall. We bound to a sensible range.
  const healthScore =
    0.45 * scan.canopyDensity +
    0.35 * scan.biomassIndex +
    0.2 * scan.soilCarbonIndex;
  const targetPrice = clamp(
    18 + healthScore * 30 + scan.confidence * 6 - scan.thermalAnomaly * 14,
    6,
    65,
  );

  // Handle catastrophic cases first.
  if (scan.classification === "invalidated") {
    const reason =
      forcedEvent?.kind === "fire"
        ? "Wildfire damage exceeded recovery threshold."
        : forcedEvent?.kind === "deforestation"
          ? "Anthropogenic deforestation detected by AI vision."
          : scan.thermalAnomaly > 0.5
            ? "Severe thermal anomaly + canopy loss confirmed."
            : "Severe canopy/biomass loss confirmed.";
    const { event } = chainInvalidate(state, parcel, reason);
    events.push(event);
    mutated = true;
    return { parcelId: parcel.id, scan, events, mutated };
  }

  // Otherwise update credits/price/status.
  const newStatus: ParcelStatus = inferStatus(parcel.status, scan);
  const message = describeOracleMutation(scan, creditsDelta, parcel.status, newStatus);
  const kind = scan.classification === "warning"
    ? "DEFORESTATION"
    : creditsDelta > 0
      ? scan.classification === "regenerating" ? "REGENERATION" : "GROWTH"
      : "SCAN";

  const { event } = chainOracleUpdate(state, parcel, {
    kind,
    message,
    creditsDelta,
    newCurrentTonnesCO2: targetTonnes,
    newPricePerCredit: targetPrice,
    statusChange: newStatus,
  });
  events.push(event);
  mutated = creditsDelta !== 0 || newStatus !== parcel.status;

  return { parcelId: parcel.id, scan, events, mutated };
}

function inferStatus(prev: ParcelStatus, scan: SatelliteScanReport): ParcelStatus {
  if (scan.classification === "invalidated") return "invalidated";
  if (scan.classification === "warning") return "warning";
  if (scan.classification === "regenerating") return "regenerating";
  if (prev === "regenerating" && scan.canopyDensity > 0.6) return "active";
  if (prev === "warning" && scan.canopyDensity > 0.7 && scan.deltaTonnesCO2 >= 0) {
    return "active";
  }
  return "active";
}

function describeOracleMutation(
  scan: SatelliteScanReport,
  delta: number,
  prevStatus: ParcelStatus,
  newStatus: ParcelStatus,
): string {
  const tons = scan.estimatedTonnesCO2.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
  if (delta > 0) {
    return `+${delta.toLocaleString()} credits issued. Verified ${tons}t CO₂e. Canopy ${(scan.canopyDensity * 100).toFixed(1)}%.`;
  }
  if (delta < 0) {
    return `${delta.toLocaleString()} credits burned. Verified ${tons}t CO₂e remaining. Status: ${newStatus}.`;
  }
  if (prevStatus !== newStatus) {
    return `Status: ${prevStatus} → ${newStatus}. Verified ${tons}t CO₂e (no credit delta).`;
  }
  return `Routine scan: ${tons}t CO₂e, canopy ${(scan.canopyDensity * 100).toFixed(1)}%, NDVI ${scan.ndvi.toFixed(2)}.`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Run the oracle across every parcel — used by the global "Run Oracle" action. */
export function runOracleNetwork(state: NetworkState): OracleResult[] {
  return state.parcels.map((parcel) => runOracleOnce({ state, parcel }));
}
