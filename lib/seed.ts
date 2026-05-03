// =============================================================================
// Reusable seeder — populates the local network with a believable demo set.
// Callable both from the npm seed script and from the /api/seed route.
// =============================================================================

import { analyzeParcel } from "./ai-vision";
import {
  chainMintParcel,
  chainOracleUpdate,
  chainTransfer,
  tonnesToCredits,
} from "./chain";
import { saveState, withState } from "./db";
import { runOracleOnce } from "./oracle";
import {
  CarbonParcel,
  EcosystemType,
  GpsCoordinate,
  NetworkState,
  Portfolio,
} from "./types";
import { mulberry32 } from "./rng";

interface ParcelSeed {
  id: string;
  name: string;
  region: string;
  ecosystem: EcosystemType;
  hectares: number;
  center: GpsCoordinate;
  ageYears: number;
  scenario: "healthy" | "growing" | "warning" | "invalidated" | "regenerating";
}

const PARCELS: ParcelSeed[] = [
  { id: "amazon-tapajos", name: "Tapajós Conservation Block", region: "Pará, Brazil", ecosystem: "tropical_rainforest", hectares: 12_400, center: { lat: -3.81, lng: -55.5 }, ageYears: 4.2, scenario: "growing" },
  { id: "borneo-sebangau", name: "Sebangau Peatland Reserve", region: "Central Kalimantan, Indonesia", ecosystem: "peatland", hectares: 6_280, center: { lat: -2.32, lng: 113.79 }, ageYears: 3.1, scenario: "warning" },
  { id: "congo-salonga", name: "Salonga Rainforest Trust", region: "Mai-Ndombe, DR Congo", ecosystem: "tropical_rainforest", hectares: 18_700, center: { lat: -2.0, lng: 21.5 }, ageYears: 5.0, scenario: "healthy" },
  { id: "sundarbans-mangrove", name: "Sundarbans Mangrove Coalition", region: "West Bengal, India", ecosystem: "mangrove", hectares: 4_200, center: { lat: 21.95, lng: 88.9 }, ageYears: 2.8, scenario: "growing" },
  { id: "alaska-tongass", name: "Tongass Boreal Carbon Sink", region: "Alaska, USA", ecosystem: "boreal_forest", hectares: 22_000, center: { lat: 57.05, lng: -134.4 }, ageYears: 6.5, scenario: "healthy" },
  { id: "okavango-wetland", name: "Okavango Delta Wetland", region: "Botswana", ecosystem: "wetland", hectares: 9_400, center: { lat: -19.28, lng: 22.8 }, ageYears: 2.1, scenario: "healthy" },
  { id: "cerrado-grassland", name: "Cerrado Restoration Mosaic", region: "Tocantins, Brazil", ecosystem: "savanna", hectares: 3_650, center: { lat: -10.1, lng: -48.3 }, ageYears: 1.6, scenario: "regenerating" },
  { id: "scandinavia-jamtland", name: "Jämtland Boreal Reserve", region: "Sweden", ecosystem: "boreal_forest", hectares: 7_900, center: { lat: 63.45, lng: 14.65 }, ageYears: 3.4, scenario: "healthy" },
  { id: "caatinga-pernambuco", name: "Caatinga Carbon Pact", region: "Pernambuco, Brazil", ecosystem: "savanna", hectares: 2_180, center: { lat: -8.6, lng: -38.3 }, ageYears: 2.0, scenario: "warning" },
  { id: "fiordland-temperate", name: "Fiordland Temperate Trust", region: "South Island, New Zealand", ecosystem: "temperate_forest", hectares: 5_500, center: { lat: -45.4, lng: 167.0 }, ageYears: 4.7, scenario: "healthy" },
  { id: "kalimantan-burnt", name: "Kalimantan Burn Recovery Block", region: "South Kalimantan, Indonesia", ecosystem: "tropical_rainforest", hectares: 3_100, center: { lat: -3.9, lng: 114.7 }, ageYears: 1.2, scenario: "invalidated" },
  { id: "ethiopia-agroforest", name: "Ethiopian Highlands Agroforestry", region: "Sidama, Ethiopia", ecosystem: "agroforestry", hectares: 1_400, center: { lat: 6.7, lng: 38.5 }, ageYears: 1.9, scenario: "growing" },
  { id: "chiapas-cloud", name: "Chiapas Cloud Forest Pact", region: "Chiapas, Mexico", ecosystem: "tropical_rainforest", hectares: 2_960, center: { lat: 16.7, lng: -92.7 }, ageYears: 3.0, scenario: "healthy" },
  { id: "british-columbia", name: "Great Bear Temperate Rainforest", region: "British Columbia, Canada", ecosystem: "temperate_forest", hectares: 14_100, center: { lat: 52.4, lng: -127.0 }, ageYears: 5.8, scenario: "healthy" },
];

function makePortfolios(): Portfolio[] {
  return [
    { address: "0xDA0C0FFEE000000000000000000000000000000A", label: "EcoOracle DAO Treasury", holdings: [], totalRetired: 0 },
    { address: "0xACME001100000000000000000000000000000B01", label: "Acme Aviation (Net-Zero 2030)", holdings: [], totalRetired: 0 },
    { address: "0xLUMENINDUSTR0000000000000000000000000C02", label: "Lumen Industries", holdings: [], totalRetired: 0 },
    { address: "0xVERDANTCAP000000000000000000000000000D03", label: "Verdant Capital", holdings: [], totalRetired: 0 },
  ];
}

function makePolygon(center: GpsCoordinate, hectares: number): GpsCoordinate[] {
  const sideKm = Math.sqrt(hectares / 100);
  const dLat = sideKm / 111;
  const dLng = sideKm / (111 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180)));
  const r = mulberry32(Math.floor(center.lat * 1000 + center.lng * 1000));
  const points: GpsCoordinate[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const jitter = 0.7 + r() * 0.5;
    points.push({
      lat: center.lat + Math.sin(angle) * dLat * jitter,
      lng: center.lng + Math.cos(angle) * dLng * jitter,
    });
  }
  return points;
}

function makeParcel(s: ParcelSeed, tokenId: number, owner: string): CarbonParcel {
  const tonnesPerHaPerYear: Record<EcosystemType, number> = {
    tropical_rainforest: 22,
    temperate_forest: 13,
    boreal_forest: 9,
    mangrove: 28,
    peatland: 18,
    savanna: 6,
    wetland: 14,
    agroforestry: 10,
  };
  const baselineTonnes = Math.round(
    s.hectares * tonnesPerHaPerYear[s.ecosystem] * Math.max(0.5, s.ageYears),
  );
  const credits = tonnesToCredits(baselineTonnes);
  const createdAt = Date.now() - s.ageYears * 365 * 24 * 60 * 60 * 1000;
  return {
    id: s.id,
    tokenId,
    name: s.name,
    region: s.region,
    ecosystem: s.ecosystem,
    hectares: s.hectares,
    center: s.center,
    polygon: makePolygon(s.center, s.hectares),
    owner,
    createdAt,
    status: "active",
    baselineTonnesCO2: baselineTonnes,
    currentTonnesCO2: baselineTonnes,
    creditsOutstanding: credits,
    creditsRetired: 0,
    pricePerCredit: 22 + Math.round(Math.random() * 10),
    scanHistory: [],
  };
}

export async function seedNetwork(): Promise<{ parcels: number; portfolios: number }> {
  const fresh: NetworkState = {
    parcels: [],
    events: [],
    transactions: [],
    portfolios: makePortfolios(),
    blockHeight: 18_204_000,
    lastBlockTimestamp: Date.now(),
  };
  saveState(fresh);

  await withState((state) => {
    const dao = state.portfolios[0];
    PARCELS.forEach((s, i) => {
      const parcel = makeParcel(s, i + 1, dao.address);
      chainMintParcel(state, parcel);
    });

    const now = Date.now();
    state.parcels.forEach((parcel) => {
      const scenario = PARCELS.find((p) => p.id === parcel.id)!.scenario;
      for (let day = 30; day >= 0; day--) {
        const ts = now - day * 24 * 60 * 60 * 1000;
        const scan = analyzeParcel({ parcel, timestamp: ts });
        parcel.scanHistory.unshift(scan);
        parcel.lastScan = scan;
      }
      parcel.scanHistory = parcel.scanHistory.slice(0, 60);

      switch (scenario) {
        case "growing": {
          const r = runOracleOnce({ state, parcel, forcedEvent: { kind: "growth", magnitude: 0.7 } });
          parcel.lastScan = r.scan;
          break;
        }
        case "warning": {
          const r = runOracleOnce({ state, parcel, forcedEvent: { kind: "deforestation", magnitude: 0.35 } });
          parcel.lastScan = r.scan;
          break;
        }
        case "invalidated": {
          const r = runOracleOnce({ state, parcel, forcedEvent: { kind: "fire", magnitude: 0.85 } });
          parcel.lastScan = r.scan;
          break;
        }
        case "regenerating": {
          runOracleOnce({ state, parcel, forcedEvent: { kind: "fire", magnitude: 0.55 } });
          parcel.status = "invalidated";
          const recovery = runOracleOnce({ state, parcel, forcedEvent: { kind: "regeneration", magnitude: 0.6 } });
          parcel.status = "regenerating";
          parcel.creditsOutstanding = Math.round(parcel.baselineTonnesCO2 * 0.25);
          parcel.lastScan = recovery.scan;
          chainOracleUpdate(state, parcel, {
            kind: "REGENERATION",
            message: "Regeneration verified post-fire. 25% of baseline credits re-issued.",
            creditsDelta: parcel.creditsOutstanding - 0,
            newCurrentTonnesCO2: parcel.baselineTonnesCO2 * 0.25,
            newPricePerCredit: parcel.pricePerCredit * 0.7,
            statusChange: "regenerating",
          });
          break;
        }
        case "healthy":
        default: {
          runOracleOnce({ state, parcel });
          break;
        }
      }
    });

    const dao2 = state.portfolios[0];
    const acme = state.portfolios[1];
    const lumen = state.portfolios[2];
    const verdant = state.portfolios[3];
    const distribute = (tokenId: number, to: Portfolio, credits: number) => {
      const parcel = state.parcels.find((p) => p.tokenId === tokenId);
      if (!parcel) return;
      try {
        chainTransfer(state, parcel, dao2.address, to.address, credits);
      } catch {
        // ignore
      }
    };
    distribute(1, acme, 25_000);
    distribute(3, acme, 40_000);
    distribute(4, lumen, 12_000);
    distribute(5, lumen, 30_000);
    distribute(8, verdant, 8_000);
    distribute(13, verdant, 10_000);
    distribute(14, verdant, 22_000);
  });

  return { parcels: PARCELS.length, portfolios: 4 };
}
