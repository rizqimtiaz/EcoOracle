// =============================================================================
// File-based persistent store for the EcoOracle network.
// Loads/saves a single JSON state file under data/runtime/state.json.
// Uses an in-memory cache with mutex-style serialization for safety.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { NetworkState } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "runtime");
const STATE_FILE = path.join(DATA_DIR, "state.json");

let cache: NetworkState | null = null;
let pending: Promise<unknown> = Promise.resolve();

function emptyState(): NetworkState {
  return {
    parcels: [],
    events: [],
    transactions: [],
    portfolios: [],
    blockHeight: 0,
    lastBlockTimestamp: Date.now(),
  };
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadState(): NetworkState {
  if (cache) return cache;
  ensureDir();
  if (!fs.existsSync(STATE_FILE)) {
    cache = emptyState();
    persistImmediate(cache);
    return cache;
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw) as NetworkState;
    cache = parsed;
    return parsed;
  } catch {
    cache = emptyState();
    persistImmediate(cache);
    return cache;
  }
}

function persistImmediate(state: NetworkState): void {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/** Replace the entire state. Persists to disk and updates the cache. */
export function saveState(state: NetworkState): void {
  cache = state;
  persistImmediate(state);
}

/**
 * Run a mutation function under a serialized lock so concurrent writes
 * do not race against each other. Returns the function's result.
 */
export async function withState<T>(
  mutator: (state: NetworkState) => T | Promise<T>,
): Promise<T> {
  const previous = pending;
  let resolveNext: () => void = () => {};
  pending = new Promise<void>((res) => {
    resolveNext = res;
  });
  try {
    await previous;
  } catch {
    // ignore previous error, we still run
  }
  try {
    const state = loadState();
    const result = await mutator(state);
    persistImmediate(state);
    cache = state;
    return result;
  } finally {
    resolveNext();
  }
}

/** Read-only access — no lock needed, but always returns the latest cache. */
export function readState(): NetworkState {
  return loadState();
}

/** Reset the in-memory cache (used by the seeder). */
export function resetCache(): void {
  cache = null;
}
