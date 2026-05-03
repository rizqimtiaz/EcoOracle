// =============================================================================
// Simulated Blockchain Layer
// -----------------------------------------------------------------------------
// In a real deployment, the contracts live in /contracts and the dApp talks to
// them via wagmi/ethers. For this self-contained demo we simulate the chain
// in-process: every state-changing call (mint, transfer, retire, oracle update,
// invalidate) creates a deterministic transaction with a hash, block number,
// and gas usage, and emits typed events that drive the UI.
//
// The simulation matches the on-chain contract semantics in
// /contracts/CarbonCreditDNFT.sol:
//
//   - tokenId is a monotonically increasing uint256
//   - each token's `creditsOutstanding` is mutable by the oracle
//   - invalidation is irreversible (until regeneration is finalized)
//   - retired credits move to a global retirement counter
// =============================================================================

import {
  CarbonParcel,
  ChainTx,
  NetworkState,
  OracleEvent,
  OracleEventKind,
  PortfolioHolding,
} from "./types";

const SECONDS_PER_BLOCK = 12;

function makeHash(state: NetworkState, salt: string): string {
  const seed = `${state.blockHeight}:${salt}:${state.transactions.length}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  let hex = "";
  let v = h;
  for (let i = 0; i < 16; i++) {
    hex += ((v ^ (v >>> 7)) & 0xff).toString(16).padStart(2, "0");
    v = Math.imul(v ^ (v >>> 13), 0x5bd1e995) >>> 0;
  }
  return `0x${hex}`;
}

function nextBlock(state: NetworkState): number {
  state.blockHeight += 1;
  state.lastBlockTimestamp = Date.now();
  return state.blockHeight;
}

function pushTx(
  state: NetworkState,
  args: Omit<ChainTx, "hash" | "blockNumber" | "timestamp" | "status" | "gasUsed"> &
    Partial<Pick<ChainTx, "gasUsed" | "status">>,
): ChainTx {
  const blockNumber = nextBlock(state);
  const hash = makeHash(state, args.method);
  const tx: ChainTx = {
    hash,
    blockNumber,
    timestamp: state.lastBlockTimestamp,
    gasUsed: args.gasUsed ?? 60_000 + Math.floor(Math.random() * 30_000),
    status: args.status ?? "success",
    from: args.from,
    to: args.to,
    method: args.method,
    args: args.args,
  };
  state.transactions.unshift(tx);
  if (state.transactions.length > 200) state.transactions.length = 200;
  return tx;
}

function pushEvent(
  state: NetworkState,
  parcel: CarbonParcel,
  kind: OracleEventKind,
  message: string,
  payload: Record<string, unknown>,
  tx: ChainTx,
): OracleEvent {
  const event: OracleEvent = {
    id: `evt_${tx.hash}_${kind}`,
    parcelId: parcel.id,
    tokenId: parcel.tokenId,
    kind,
    timestamp: tx.timestamp,
    blockNumber: tx.blockNumber,
    txHash: tx.hash,
    payload,
    message,
  };
  state.events.unshift(event);
  if (state.events.length > 500) state.events.length = 500;
  return event;
}

export function nextTokenId(state: NetworkState): number {
  return (
    state.parcels.reduce((max, p) => Math.max(max, p.tokenId), 0) + 1
  );
}

// ---------- Public chain operations ------------------------------------------

export function chainMintParcel(
  state: NetworkState,
  parcel: CarbonParcel,
): { tx: ChainTx; event: OracleEvent } {
  state.parcels.push(parcel);
  const tx = pushTx(state, {
    from: "0x0000000000000000000000000000000000000000",
    to: parcel.owner,
    method: "mintCarbonCredit",
    args: {
      tokenId: parcel.tokenId,
      to: parcel.owner,
      hectares: parcel.hectares,
      ecosystem: parcel.ecosystem,
      lat: parcel.center.lat,
      lng: parcel.center.lng,
      baselineTonnesCO2: parcel.baselineTonnesCO2,
    },
    gasUsed: 215_400,
  });
  const event = pushEvent(
    state,
    parcel,
    "MINT",
    `Minted dNFT #${parcel.tokenId} for ${parcel.name} (${parcel.hectares.toLocaleString()} ha).`,
    {
      hectares: parcel.hectares,
      baselineTonnesCO2: parcel.baselineTonnesCO2,
    },
    tx,
  );
  // mark owner portfolio
  const portfolio = state.portfolios.find((p) => p.address === parcel.owner);
  if (portfolio) {
    const holding: PortfolioHolding = {
      parcelId: parcel.id,
      tokenId: parcel.tokenId,
      credits: parcel.creditsOutstanding,
      acquiredAt: tx.timestamp,
      costBasisUsd: parcel.creditsOutstanding * parcel.pricePerCredit,
    };
    portfolio.holdings.push(holding);
  }
  return { tx, event };
}

export function chainOracleUpdate(
  state: NetworkState,
  parcel: CarbonParcel,
  payload: {
    kind: OracleEventKind;
    message: string;
    creditsDelta: number;
    newCurrentTonnesCO2: number;
    newPricePerCredit: number;
    statusChange?: CarbonParcel["status"];
  },
): { tx: ChainTx; event: OracleEvent } {
  const before = parcel.creditsOutstanding;
  parcel.creditsOutstanding = Math.max(0, parcel.creditsOutstanding + payload.creditsDelta);
  parcel.currentTonnesCO2 = Math.max(0, payload.newCurrentTonnesCO2);
  parcel.pricePerCredit = Math.max(0.5, payload.newPricePerCredit);
  if (payload.statusChange) parcel.status = payload.statusChange;

  // Reflect credit change in current owner's portfolio for clarity.
  const portfolio = state.portfolios.find((p) => p.address === parcel.owner);
  if (portfolio) {
    const h = portfolio.holdings.find((x) => x.tokenId === parcel.tokenId);
    if (h) {
      h.credits = Math.max(0, h.credits + payload.creditsDelta);
    }
  }

  const tx = pushTx(state, {
    from: ORACLE_ADDRESS,
    to: parcel.owner,
    method: "updateCarbonState",
    args: {
      tokenId: parcel.tokenId,
      eventKind: payload.kind,
      creditsBefore: before,
      creditsAfter: parcel.creditsOutstanding,
      tonnesCO2: parcel.currentTonnesCO2,
      newPricePerCredit: parcel.pricePerCredit,
      status: parcel.status,
    },
    gasUsed: 92_300,
  });

  const event = pushEvent(
    state,
    parcel,
    payload.kind,
    payload.message,
    {
      creditsDelta: payload.creditsDelta,
      creditsAfter: parcel.creditsOutstanding,
      tonnesCO2: parcel.currentTonnesCO2,
      pricePerCredit: parcel.pricePerCredit,
      status: parcel.status,
    },
    tx,
  );
  return { tx, event };
}

export function chainInvalidate(
  state: NetworkState,
  parcel: CarbonParcel,
  reason: string,
): { tx: ChainTx; event: OracleEvent } {
  const before = parcel.creditsOutstanding;
  parcel.creditsOutstanding = 0;
  parcel.status = "invalidated";
  parcel.currentTonnesCO2 = 0;

  const portfolio = state.portfolios.find((p) => p.address === parcel.owner);
  if (portfolio) {
    const h = portfolio.holdings.find((x) => x.tokenId === parcel.tokenId);
    if (h) h.credits = 0;
  }

  const tx = pushTx(state, {
    from: ORACLE_ADDRESS,
    to: parcel.owner,
    method: "invalidate",
    args: {
      tokenId: parcel.tokenId,
      reason,
      creditsBurned: before,
    },
    gasUsed: 58_700,
  });
  const event = pushEvent(
    state,
    parcel,
    "INVALIDATION",
    `Credits invalidated for #${parcel.tokenId}: ${reason}`,
    { reason, creditsBurned: before },
    tx,
  );
  return { tx, event };
}

export function chainTransfer(
  state: NetworkState,
  parcel: CarbonParcel,
  fromAddress: string,
  toAddress: string,
  credits: number,
): { tx: ChainTx; event: OracleEvent } {
  const fromPortfolio = state.portfolios.find((p) => p.address === fromAddress);
  const toPortfolio = state.portfolios.find((p) => p.address === toAddress);
  if (!fromPortfolio || !toPortfolio) {
    throw new Error("Unknown portfolio address.");
  }
  const fromHolding = fromPortfolio.holdings.find((h) => h.tokenId === parcel.tokenId);
  if (!fromHolding || fromHolding.credits < credits) {
    throw new Error("Insufficient credits in source portfolio.");
  }
  fromHolding.credits -= credits;
  if (fromHolding.credits === 0) {
    fromPortfolio.holdings = fromPortfolio.holdings.filter((h) => h !== fromHolding);
  }
  const existing = toPortfolio.holdings.find((h) => h.tokenId === parcel.tokenId);
  if (existing) {
    existing.credits += credits;
    existing.costBasisUsd += credits * parcel.pricePerCredit;
  } else {
    toPortfolio.holdings.push({
      parcelId: parcel.id,
      tokenId: parcel.tokenId,
      credits,
      acquiredAt: Date.now(),
      costBasisUsd: credits * parcel.pricePerCredit,
    });
  }

  const tx = pushTx(state, {
    from: fromAddress,
    to: toAddress,
    method: "transferCredits",
    args: {
      tokenId: parcel.tokenId,
      credits,
      pricePerCredit: parcel.pricePerCredit,
    },
    gasUsed: 47_900,
  });
  const event = pushEvent(
    state,
    parcel,
    "TRANSFER",
    `${credits.toLocaleString()} credits transferred from ${shortAddr(fromAddress)} to ${shortAddr(toAddress)}.`,
    { credits, fromAddress, toAddress },
    tx,
  );
  return { tx, event };
}

export function chainRetire(
  state: NetworkState,
  parcel: CarbonParcel,
  fromAddress: string,
  credits: number,
  beneficiary: string,
): { tx: ChainTx; event: OracleEvent } {
  const portfolio = state.portfolios.find((p) => p.address === fromAddress);
  if (!portfolio) throw new Error("Unknown portfolio.");
  const holding = portfolio.holdings.find((h) => h.tokenId === parcel.tokenId);
  if (!holding || holding.credits < credits) {
    throw new Error("Insufficient credits to retire.");
  }
  holding.credits -= credits;
  portfolio.totalRetired += credits;
  parcel.creditsRetired += credits;
  parcel.creditsOutstanding = Math.max(0, parcel.creditsOutstanding - credits);

  if (holding.credits === 0) {
    portfolio.holdings = portfolio.holdings.filter((h) => h !== holding);
  }

  const tx = pushTx(state, {
    from: fromAddress,
    to: parcel.owner,
    method: "retireCredits",
    args: {
      tokenId: parcel.tokenId,
      credits,
      beneficiary,
    },
    gasUsed: 51_200,
  });
  const event = pushEvent(
    state,
    parcel,
    "RETIRE",
    `${credits.toLocaleString()} credits retired by ${shortAddr(fromAddress)} on behalf of "${beneficiary}".`,
    { credits, beneficiary, fromAddress },
    tx,
  );
  return { tx, event };
}

// ---- Helpers ----------------------------------------------------------------

export const ORACLE_ADDRESS = "0xORACLE0000000000000000000000000000000001";

export function shortAddr(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function tonnesToCredits(tonnes: number): number {
  // 1 credit = 1 tonne of CO2-equivalent.
  return Math.max(0, Math.round(tonnes));
}

export { SECONDS_PER_BLOCK };
