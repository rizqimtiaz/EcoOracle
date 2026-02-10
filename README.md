# EcoOracle — Autonomous Carbon Integrity Network

EcoOracle is a full-stack reference implementation of an **autonomous carbon
integrity network**. Every carbon credit is a **dynamic NFT (dNFT)** anchored
to a specific GPS coordinate. The platform runs an **AI vision pipeline** on
satellite imagery in a continuous loop and an **autonomous oracle** pushes the
verified state on-chain in real time — minting, burning, or invalidating
credits based on what the planet actually looks like today.

This repository contains:

- A production-grade Next.js 14 frontend (App Router, TypeScript, Tailwind, Recharts).
- A self-contained AI vision engine that simulates a Sentinel-2 / Planet
  pipeline computing NDVI, canopy density, biomass, soil-carbon, moisture and
  thermal-anomaly indices, with per-ecosystem calibration.
- A simulated EVM-compatible blockchain layer (mint, transfer, retire,
  oracle update, invalidate) with a complete event/transaction log.
- An autonomous oracle service that bridges AI scans to on-chain state.
- Two Solidity smart contracts (`CarbonCreditDNFT.sol` and
  `CarbonOracle.sol`) ready for deployment on any EVM L1/L2.
- A live, interactive dashboard, world map, marketplace, parcel detail
  pages, oracle event log, and corporate portfolio views.

---

## Quick start

```bash
npm install
npm run seed        # populate the local devnet with 14 parcels worldwide
npm run dev         # start the Next.js app at http://localhost:3000
```

Open **http://localhost:3000** and explore.

To rebuild the demo network at any time, click **Reset Network** in the
dashboard or run `npm run seed`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EcoOracle Frontend (Next.js)                 │
│                                                                     │
│   /                Hero + landing                                   │
│   /dashboard       Live metrics, oracle controls, charts            │
│   /map             Interactive globe with all parcels               │
│   /marketplace     Browse and filter dNFT parcels                   │
│   /marketplace/:id Parcel detail (map, timeseries, trade, scan)     │
│   /analyze         Live AI vision pipeline demo                     │
│   /oracle          On-chain event log + tx log                      │
│   /portfolio       Wallet holdings, retirement, P&L                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        REST API (Next.js Route Handlers)            │
│   /api/state        Aggregated network snapshot                     │
│   /api/parcels      List parcels                                    │
│   /api/parcels/:id  Single parcel + events + txs                    │
│   /api/analyze      Run AI scan on a parcel (with optional event)   │
│   /api/oracle/run   Run autonomous oracle across the network        │
│   /api/events       Filtered event log                              │
│   /api/transactions Raw transaction list                            │
│   /api/portfolios   List wallets                                    │
│   /api/trade        Buy / retire credits                            │
│   /api/seed         Reset to seeded state                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Domain core (lib/)                           │
│                                                                     │
│   types.ts        Shared types for parcels, scans, events, NFTs     │
│   ai-vision.ts    Computer-vision engine (per-ecosystem profiles)   │
│   chain.ts        Simulated chain (mint/transfer/retire/invalidate) │
│   oracle.ts       Autonomous oracle bridging vision -> chain        │
│   db.ts           File-based persistent state w/ mutex              │
│   stats.ts        Network statistics & timeseries                   │
│   format.ts       Display formatters & status palettes              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Solidity contracts                           │
│   CarbonCreditDNFT.sol   ERC-721 dNFT with mutable carbon state     │
│   CarbonOracle.sol       Whitelisted-signer oracle aggregator       │
└─────────────────────────────────────────────────────────────────────┘
```

State persists to `data/runtime/state.json`.

---

## How it works

### 1. Mint a parcel as a dNFT

A protected plot of land is geo-fenced (polygon + center coordinate) and
minted as an ERC-721 token. The token records the ecosystem type, hectares,
baseline tonnes of CO₂e, an initial credit issuance, and a starting price.

### 2. AI Vision Engine

`lib/ai-vision.ts` simulates a per-ecosystem CV pipeline. For each parcel and
timestamp it deterministically computes:

| Index | Description |
| ---- | ---- |
| NDVI | Normalized Difference Vegetation Index (greenness proxy) |
| Canopy density | Tree cover proportion |
| Biomass index | Above-ground biomass proxy |
| Soil carbon index | Belowground carbon proxy |
| Moisture index | Soil moisture / canopy water proxy |
| Thermal anomaly | Heat anomaly (fire-risk proxy) |

It then derives an **estimated tonnes CO₂e** using a calibrated linear model
that accounts for the parcel's age, hectares, and ecosystem-specific yearly
sequestration rate.

Discrete events (`growth`, `deforestation`, `fire`, `regeneration`) materially
shift the indices, and the engine emits human-readable notes describing what
changed.

### 3. Autonomous Oracle

`lib/oracle.ts` is the bridge. After each scan it:

- Computes a target credit count (1 credit = 1 verified tonne).
- Computes a target price (a function of health + scarcity + thermal risk).
- Decides whether to update, downgrade, or invalidate the dNFT.
- Pushes the change on-chain via `chainOracleUpdate` or `chainInvalidate`,
  appending a transaction and an event to the network log.

Run the autonomous oracle across all parcels with:

- The "Run Oracle Sweep" button on the dashboard, or
- `POST /api/oracle/run`.

### 4. Smart contracts (`contracts/`)

`CarbonCreditDNFT.sol` implements:

<!-- metadata: nzlzznn93s -->
<!-- metadata: z8oybc8oyx -->
<!-- metadata: d1sfr2tsab -->
<!-- metadata: 0ey0uznryk -->
<!-- metadata: 3gf58tqunm -->
<!-- metadata: r712sn2zer -->
<!-- metadata: hbivj15tia -->
<!-- metadata: 1xkxih379p -->
- A minimal ERC-721 surface (transfer, approve, balanceOf).
- A `Parcel` struct per token with packed dynamic state.
- `updateCarbonState(...)` — only callable by the oracle.
- `invalidate(...)` — burns all outstanding credits.
- `transferCredits(...)` and `retireCredits(...)` — fungible credits attached
  to each token, retired credits flow into a global counter.

`CarbonOracle.sol` is a whitelist-aggregator: only authorized DON nodes can
co-sign a report, and `publishReport(...)` requires at least `minSigners`
valid signers before it forwards the call to the dNFT.

For deployment instructions on any EVM chain, see the comments inside each
contract — both compile as-is with `solc 0.8.20`.

### 5. Marketplace & Portfolio

Buyers transfer credits between wallets at the dNFT's current price, or
retire credits permanently against a beneficiary. Retirements are immutable
and aggregate into a global retirement counter. Invalidated dNFTs cannot be
traded — the smart contract reverts.

---

## Demo scenarios to try

1. Open `/dashboard` and click **Run Oracle Sweep**. Watch verified tonnes and
   credit counts shift across all parcels.
2. Open `/analyze`, pick a healthy parcel like *Tongass Boreal Carbon Sink*,
   choose the **Wildfire** scenario at 80% magnitude, and run. Observe the
   parcel transition to **Invalidated**, all credits burned, an
   `INVALIDATION` event written to chain.
3. Go to `/marketplace`, find an active parcel, open it and use the **Trade &
   Retire** panel to retire 1,000 credits on behalf of *Acme Aviation*. Then
   visit `/portfolio` and confirm the retirement counter incremented.
4. Trigger a **Regeneration** event on the *Kalimantan Burn Recovery Block*
   (already invalidated) and watch credits gradually re-issue.

---

## File map

```
app/                  Next.js 14 App Router
  layout.tsx          Global layout, navbar, footer, background
  page.tsx            Landing page with hero, problem, pipeline, CTA
  dashboard/          Live network dashboard
  map/                Interactive global map
  marketplace/        dNFT catalogue & detail pages
  analyze/            Live AI vision demo
  oracle/             Event + transaction log
  portfolio/          Wallet holdings & retirement
  api/                Route handlers (REST endpoints)
components/           Reusable UI (charts, panels, controls)
contracts/            Solidity smart contracts
lib/                  Domain core (vision, chain, oracle, db, types)
scripts/seed.ts       Seeds the demo network
data/runtime/         Persistent JSON state (auto-created)
```

---

## License

MIT.
