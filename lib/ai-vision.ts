// =============================================================================
// AI Vision Engine
// -----------------------------------------------------------------------------
// Simulates a computer-vision pipeline analyzing high-resolution satellite
// imagery. For a real production deployment this would be replaced by a
// pipeline that fetches imagery from Sentinel-2 / Planet Labs and runs
// a deep model (e.g. U-Net for canopy segmentation, CNN regressor for
// biomass) on each parcel.
//
// To keep the demo fully self-contained we model the same outputs with a
// physics-inspired stochastic process that:
//
//   - Anchors per-ecosystem baselines (NDVI, biomass, soil carbon)
//   - Adds slow seasonal trends + small daily noise
//   - Allows discrete "events" (fire, deforestation, regeneration) which
//     materially shift the state of a parcel
//   - Computes a tonnes-CO2 estimate from the indices using a calibrated
//     linear model with hectare scaling
//
// Output is fully deterministic given the same parcel id + timestamp,
// so demos are reproducible.
// =============================================================================

import { CarbonParcel, EcosystemType, ParcelStatus, SatelliteScanReport } from "./types";
import { clamp01, mulberry32, hashString, lerp } from "./rng";

interface EcosystemProfile {
  baseNdvi: number;
  baseCanopy: number;
  baseBiomass: number;
  baseSoilCarbon: number;
  baseMoisture: number;
  fireRiskBase: number;
  /** tonnes of CO2 sequestered per hectare per year at full health */
  yearlyCo2PerHectare: number;
}

const ECOSYSTEMS: Record<EcosystemType, EcosystemProfile> = {
  tropical_rainforest: {
    baseNdvi: 0.86,
    baseCanopy: 0.92,
    baseBiomass: 0.9,
    baseSoilCarbon: 0.78,
    baseMoisture: 0.82,
    fireRiskBase: 0.05,
    yearlyCo2PerHectare: 22,
  },
  temperate_forest: {
    baseNdvi: 0.78,
    baseCanopy: 0.82,
    baseBiomass: 0.74,
    baseSoilCarbon: 0.7,
    baseMoisture: 0.62,
    fireRiskBase: 0.08,
    yearlyCo2PerHectare: 13,
  },
  boreal_forest: {
    baseNdvi: 0.7,
    baseCanopy: 0.74,
    baseBiomass: 0.68,
    baseSoilCarbon: 0.84,
    baseMoisture: 0.55,
    fireRiskBase: 0.07,
    yearlyCo2PerHectare: 9,
  },
  mangrove: {
    baseNdvi: 0.74,
    baseCanopy: 0.7,
    baseBiomass: 0.78,
    baseSoilCarbon: 0.92,
    baseMoisture: 0.94,
    fireRiskBase: 0.02,
    yearlyCo2PerHectare: 28,
  },
  peatland: {
    baseNdvi: 0.6,
    baseCanopy: 0.5,
    baseBiomass: 0.55,
    baseSoilCarbon: 0.96,
    baseMoisture: 0.9,
    fireRiskBase: 0.06,
    yearlyCo2PerHectare: 18,
  },
  savanna: {
    baseNdvi: 0.52,
    baseCanopy: 0.42,
    baseBiomass: 0.4,
    baseSoilCarbon: 0.5,
    baseMoisture: 0.32,
    fireRiskBase: 0.18,
    yearlyCo2PerHectare: 6,
  },
  wetland: {
    baseNdvi: 0.66,
    baseCanopy: 0.55,
    baseBiomass: 0.6,
    baseSoilCarbon: 0.86,
    baseMoisture: 0.95,
    fireRiskBase: 0.03,
    yearlyCo2PerHectare: 14,
  },
  agroforestry: {
    baseNdvi: 0.7,
    baseCanopy: 0.6,
    baseBiomass: 0.58,
    baseSoilCarbon: 0.62,
    baseMoisture: 0.6,
    fireRiskBase: 0.07,
    yearlyCo2PerHectare: 10,
  },
};

export type ScanEvent =
  | { kind: "normal" }
  | { kind: "growth"; magnitude: number }
  | { kind: "deforestation"; magnitude: number }
  | { kind: "fire"; magnitude: number }
  | { kind: "regeneration"; magnitude: number };

interface AnalyzeArgs {
  parcel: CarbonParcel;
  /** Optional explicit event override (used by the live analyze page). */
  event?: ScanEvent;
  /** Override the timestamp (defaults to now). */
  timestamp?: number;
}

/**
 * Runs the AI Vision pipeline on a parcel and returns a fresh scan report.
 * Pure function — does not mutate the parcel.
 */
export function analyzeParcel({
  parcel,
  event,
  timestamp = Date.now(),
}: AnalyzeArgs): SatelliteScanReport {
  const profile = ECOSYSTEMS[parcel.ecosystem];
  const rng = mulberry32(hashString(`${parcel.id}:${timestamp}`));

  // Recover the previous scan to compute deltas and smooth state transitions.
  const prev = parcel.lastScan;

  // ---- Step 1: seasonal/longterm drift -------------------------------------
  // Use a sin wave keyed to the parcel + day-of-year for a believable cycle.
  const dayOfYear = Math.floor((timestamp / 86_400_000) % 365);
  const seasonal = Math.sin((dayOfYear / 365) * Math.PI * 2) * 0.04;

  // ---- Step 2: small daily stochastic noise --------------------------------
  const n = () => (rng() - 0.5) * 0.04;

  // ---- Step 3: integrate previous state with a smoothing factor ------------
  const blend = 0.7; // weight given to prev state — keeps things stable
  const baseNdvi = prev ? lerp(profile.baseNdvi, prev.ndvi, blend) : profile.baseNdvi;
  const baseCanopy = prev ? lerp(profile.baseCanopy, prev.canopyDensity, blend) : profile.baseCanopy;
  const baseBiomass = prev ? lerp(profile.baseBiomass, prev.biomassIndex, blend) : profile.baseBiomass;
  const baseSoil = prev ? lerp(profile.baseSoilCarbon, prev.soilCarbonIndex, blend) : profile.baseSoilCarbon;
  const baseMoisture = prev ? lerp(profile.baseMoisture, prev.moistureIndex, blend) : profile.baseMoisture;

  let ndvi = baseNdvi + seasonal + n();
  let canopy = baseCanopy + seasonal * 0.5 + n();
  let biomass = baseBiomass + seasonal * 0.5 + n();
  let soil = baseSoil + n() * 0.5;
  let moisture = baseMoisture + seasonal * 0.6 + n();
  let thermal = profile.fireRiskBase + Math.max(0, -seasonal) + n() * 0.4;

  const notes: string[] = [];

  // ---- Step 4: event overlays ---------------------------------------------
  const ev: ScanEvent = event ?? rollEvent(rng, parcel, profile);
  let classification: ParcelStatus = "active";

  switch (ev.kind) {
    case "fire": {
      const m = ev.magnitude;
      ndvi -= 0.55 * m;
      canopy -= 0.7 * m;
      biomass -= 0.8 * m;
      soil -= 0.2 * m;
      moisture -= 0.4 * m;
      thermal = clamp01(thermal + 0.6 * m);
      notes.push(
        `Wildfire detected. Estimated burn coverage: ${(m * 100).toFixed(1)}% of parcel area.`,
      );
      classification = m > 0.6 ? "invalidated" : "warning";
      break;
    }
    case "deforestation": {
      const m = ev.magnitude;
      ndvi -= 0.45 * m;
      canopy -= 0.7 * m;
      biomass -= 0.65 * m;
      soil -= 0.15 * m;
      notes.push(
        `Anthropogenic canopy loss detected. ~${(m * 100).toFixed(1)}% canopy reduction in scan window.`,
      );
      classification = m > 0.5 ? "invalidated" : "warning";
      break;
    }
    case "growth": {
      const m = ev.magnitude;
      ndvi += 0.05 * m;
      canopy += 0.06 * m;
      biomass += 0.08 * m;
      soil += 0.04 * m;
      notes.push(
        `Healthy growth signal: NDVI +${(0.05 * m * 100).toFixed(2)}%, canopy density rising.`,
      );
      classification = "active";
      break;
    }
    case "regeneration": {
      const m = ev.magnitude;
      ndvi += 0.12 * m;
      canopy += 0.15 * m;
      biomass += 0.2 * m;
      notes.push(
        `Regeneration confirmed. Carbon recovery trajectory: ${(m * 100).toFixed(0)}% of pre-event biomass.`,
      );
      classification = "regenerating";
      break;
    }
    default:
      notes.push("Scan nominal. No anomalies detected by the vision model.");
      classification = "active";
  }

  // ---- Step 5: clamp to valid ranges --------------------------------------
  ndvi = clamp01(ndvi);
  canopy = clamp01(canopy);
  biomass = clamp01(biomass);
  soil = clamp01(soil);
  moisture = clamp01(moisture);
  thermal = clamp01(thermal);

  // ---- Step 6: estimate tonnes of CO2 -------------------------------------
  // Linear-ish model combining the headline indices, scaled by hectares.
  // We treat baseline as the lock-in at minting.
  const healthFactor = clamp01(0.45 * canopy + 0.35 * biomass + 0.2 * soil);
  const baselineYear = profile.yearlyCo2PerHectare * parcel.hectares;
  // Assume parcel has been protected since createdAt; cumulative tonnes grow.
  const yearsActive = Math.max(
    0.05,
    (timestamp - parcel.createdAt) / (365 * 24 * 60 * 60 * 1000),
  );
  let estTonnes = parcel.baselineTonnesCO2 + baselineYear * yearsActive * healthFactor;

  // If this is a destructive event, drop the cumulative score significantly.
  if (ev.kind === "fire" || ev.kind === "deforestation") {
    const lossFactor = ev.magnitude;
    estTonnes *= 1 - lossFactor;
  }

  // Recovery slowly brings tonnes back if regenerating.
  if (ev.kind === "regeneration") {
    const recoveryFactor = ev.magnitude;
    const target = parcel.baselineTonnesCO2 + baselineYear * yearsActive;
    estTonnes = lerp(estTonnes, target, recoveryFactor * 0.3);
  }

  estTonnes = Math.max(0, estTonnes);
  const deltaTonnes = prev ? estTonnes - prev.estimatedTonnesCO2 : 0;

  // ---- Step 7: confidence model -------------------------------------------
  // Confidence drops on extreme events and low moisture (cloud cover proxy).
  let confidence = 0.92;
  if (ev.kind === "fire" || ev.kind === "deforestation") {
    confidence -= 0.05 * ev.magnitude;
  }
  confidence -= (1 - moisture) * 0.1;
  confidence += rng() * 0.04;
  confidence = clamp01(confidence);

  return {
    id: `scan_${parcel.id}_${timestamp}`,
    parcelId: parcel.id,
    timestamp,
    canopyDensity: round(canopy, 4),
    ndvi: round(ndvi, 4),
    biomassIndex: round(biomass, 4),
    soilCarbonIndex: round(soil, 4),
    moistureIndex: round(moisture, 4),
    thermalAnomaly: round(thermal, 4),
    estimatedTonnesCO2: round(estTonnes, 2),
    deltaTonnesCO2: round(deltaTonnes, 2),
    confidence: round(confidence, 4),
    classification,
    notes,
  };
}

function rollEvent(
  rng: () => number,
  parcel: CarbonParcel,
  profile: EcosystemProfile,
): ScanEvent {
  // If the parcel is already invalidated, regeneration is the next likely state.
  if (parcel.status === "invalidated") {
    if (rng() < 0.35) return { kind: "regeneration", magnitude: 0.4 + rng() * 0.4 };
    return { kind: "normal" };
  }
  if (parcel.status === "regenerating") {
    if (rng() < 0.5) return { kind: "regeneration", magnitude: 0.3 + rng() * 0.3 };
    if (rng() < 0.05) return { kind: "growth", magnitude: 0.4 + rng() * 0.4 };
    return { kind: "normal" };
  }

  const fireRoll = rng();
  if (fireRoll < profile.fireRiskBase * 0.05) {
    return { kind: "fire", magnitude: 0.3 + rng() * 0.6 };
  }
  const deforestRoll = rng();
  if (deforestRoll < 0.012) {
    return { kind: "deforestation", magnitude: 0.25 + rng() * 0.55 };
  }
  const growthRoll = rng();
  if (growthRoll < 0.18) {
    return { kind: "growth", magnitude: 0.4 + rng() * 0.5 };
  }
  return { kind: "normal" };
}

function round(v: number, digits: number): number {
  const p = Math.pow(10, digits);
  return Math.round(v * p) / p;
}

export const ECOSYSTEM_PROFILES = ECOSYSTEMS;
