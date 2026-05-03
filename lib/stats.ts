// =============================================================================
// Network statistics derivation. Pure functions over NetworkState.
// =============================================================================

import { CarbonParcel, NetworkState, NetworkStats } from "./types";

export function computeStats(state: NetworkState): NetworkStats {
  const totalParcels = state.parcels.length;
  let totalHectares = 0;
  let totalCreditsOutstanding = 0;
  let totalCreditsRetired = 0;
  let totalTonnesCO2 = 0;
  let activeParcels = 0;
  let invalidatedParcels = 0;
  let regeneratingParcels = 0;
  let warningParcels = 0;
  let priceSum = 0;
  let priceCount = 0;

  for (const p of state.parcels) {
    totalHectares += p.hectares;
    totalCreditsOutstanding += p.creditsOutstanding;
    totalCreditsRetired += p.creditsRetired;
    totalTonnesCO2 += p.currentTonnesCO2;
    if (p.status === "active") activeParcels++;
    else if (p.status === "invalidated") invalidatedParcels++;
    else if (p.status === "regenerating") regeneratingParcels++;
    else if (p.status === "warning") warningParcels++;

    if (p.creditsOutstanding > 0) {
      priceSum += p.pricePerCredit;
      priceCount++;
    }
  }

  return {
    totalParcels,
    totalHectares,
    totalCreditsOutstanding,
    totalCreditsRetired,
    totalTonnesCO2,
    activeParcels,
    invalidatedParcels,
    regeneratingParcels,
    warningParcels,
    averagePricePerCredit: priceCount > 0 ? priceSum / priceCount : 0,
    blockHeight: state.blockHeight,
    lastBlockTimestamp: state.lastBlockTimestamp,
  };
}

export function totalsByEcosystem(state: NetworkState): {
  ecosystem: string;
  hectares: number;
  tonnesCO2: number;
  parcels: number;
}[] {
  const map = new Map<string, { hectares: number; tonnesCO2: number; parcels: number }>();
  for (const p of state.parcels) {
    const cur = map.get(p.ecosystem) ?? { hectares: 0, tonnesCO2: 0, parcels: 0 };
    cur.hectares += p.hectares;
    cur.tonnesCO2 += p.currentTonnesCO2;
    cur.parcels += 1;
    map.set(p.ecosystem, cur);
  }
  return Array.from(map.entries()).map(([ecosystem, v]) => ({
    ecosystem,
    ...v,
  }));
}

export function networkTimeseries(state: NetworkState, days: number): {
  date: string;
  tonnesCO2: number;
  credits: number;
  active: number;
  warning: number;
  invalidated: number;
}[] {
  const out: {
    date: string;
    tonnesCO2: number;
    credits: number;
    active: number;
    warning: number;
    invalidated: number;
  }[] = [];
  const now = Date.now();
  for (let d = days - 1; d >= 0; d--) {
    const ts = now - d * 24 * 60 * 60 * 1000;
    let tonnes = 0;
    let credits = 0;
    let active = 0;
    let warning = 0;
    let invalidated = 0;
    for (const p of state.parcels) {
      const scan = closestScan(p, ts);
      if (!scan) continue;
      tonnes += scan.estimatedTonnesCO2;
      credits += Math.max(0, Math.round(scan.estimatedTonnesCO2));
      if (scan.classification === "active" || scan.classification === "regenerating") active++;
      if (scan.classification === "warning") warning++;
      if (scan.classification === "invalidated") invalidated++;
    }
    out.push({
      date: new Date(ts).toISOString().slice(0, 10),
      tonnesCO2: Math.round(tonnes),
      credits: Math.round(credits),
      active,
      warning,
      invalidated,
    });
  }
  return out;
}

function closestScan(p: CarbonParcel, ts: number) {
  if (p.scanHistory.length === 0) return null;
  let best = p.scanHistory[0];
  let bestDiff = Math.abs(best.timestamp - ts);
  for (const s of p.scanHistory) {
    const d = Math.abs(s.timestamp - ts);
    if (d < bestDiff) {
      best = s;
      bestDiff = d;
    }
  }
  return best;
}
