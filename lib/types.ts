// =============================================================================
// EcoOracle — Core Domain Types
// -----------------------------------------------------------------------------
// These types describe the entire data model of the Autonomous Carbon Integrity
// Network: parcels of land, dynamic NFTs, AI satellite reports, blockchain
// state changes, oracle events, and user portfolios.
// =============================================================================

export type EcosystemType =
  | "tropical_rainforest"
  | "temperate_forest"
  | "boreal_forest"
  | "mangrove"
  | "peatland"
  | "savanna"
  | "wetland"
  | "agroforestry";

export type ParcelStatus =
  | "active" // healthy, generating credits
  | "warning" // detected stress / partial loss
  | "invalidated" // burnt / cleared / destroyed
  | "regenerating" // recovering after a loss event
  | "pending"; // newly minted, awaiting first scan

export type OracleEventKind =
  | "MINT" // dNFT created
  | "SCAN" // routine satellite scan completed
  | "GROWTH" // biomass/canopy increased materially
  | "DEFORESTATION" // detected canopy loss
  | "FIRE" // wildfire detected
  | "INVALIDATION" // credits invalidated on-chain
  | "REGENERATION" // recovery detected
  | "TRANSFER" // ownership change
  | "RETIRE"; // credits retired (used to offset)

export interface GpsCoordinate {
  lat: number; // -90..90
  lng: number; // -180..180
}

/** A scan report produced by the AI Vision Engine for a given parcel. */
export interface SatelliteScanReport {
  id: string;
  parcelId: string;
  timestamp: number; // ms epoch

  // Computer-vision derived metrics (0..1)
  canopyDensity: number;
  ndvi: number; // Normalized Difference Vegetation Index, 0..1 scaled
  biomassIndex: number;
  soilCarbonIndex: number;
  moistureIndex: number;
  thermalAnomaly: number; // 0..1, higher = more heat anomaly (fire risk)

  // Derived
  estimatedTonnesCO2: number; // total tonnes sequestered to-date
  deltaTonnesCO2: number; // change vs. previous scan
  confidence: number; // 0..1
  classification: ParcelStatus;
  notes: string[];
}

/** A carbon parcel — a specific GPS-bounded plot of protected land. */
export interface CarbonParcel {
  id: string; // internal id
  tokenId: number; // dNFT token id
  name: string;
  region: string; // human readable region/country
  ecosystem: EcosystemType;
  hectares: number;
  center: GpsCoordinate;
  polygon: GpsCoordinate[]; // simplified outline
  owner: string; // wallet address
  createdAt: number;
  status: ParcelStatus;

  // Dynamic state (mirrored on-chain)
  baselineTonnesCO2: number; // tonnes at minting
  currentTonnesCO2: number; // current verified tonnes
  creditsOutstanding: number; // total credits attached to this dNFT
  creditsRetired: number; // credits already used to offset
  pricePerCredit: number; // USD
  lastScan?: SatelliteScanReport;
  scanHistory: SatelliteScanReport[];
}

/** An on-chain event emitted by the EcoOracle. */
export interface OracleEvent {
  id: string;
  parcelId: string;
  tokenId: number;
  kind: OracleEventKind;
  timestamp: number;
  blockNumber: number;
  txHash: string;
  payload: Record<string, unknown>;
  message: string;
}

/** A simulated blockchain transaction. */
export interface ChainTx {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  method: string;
  args: Record<string, unknown>;
  gasUsed: number;
  status: "success" | "reverted";
}

/** Holding of dNFT credits by a wallet. */
export interface PortfolioHolding {
  parcelId: string;
  tokenId: number;
  credits: number;
  acquiredAt: number;
  costBasisUsd: number;
}

export interface Portfolio {
  address: string;
  label: string;
  holdings: PortfolioHolding[];
  totalRetired: number;
}

/** Snapshot of network-wide stats. */
export interface NetworkStats {
  totalParcels: number;
  totalHectares: number;
  totalCreditsOutstanding: number;
  totalCreditsRetired: number;
  totalTonnesCO2: number;
  activeParcels: number;
  invalidatedParcels: number;
  regeneratingParcels: number;
  warningParcels: number;
  averagePricePerCredit: number;
  blockHeight: number;
  lastBlockTimestamp: number;
}

/** Full snapshot of the simulated chain + AI network state. */
export interface NetworkState {
  parcels: CarbonParcel[];
  events: OracleEvent[];
  transactions: ChainTx[];
  portfolios: Portfolio[];
  blockHeight: number;
  lastBlockTimestamp: number;
}
