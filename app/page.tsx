import Link from "next/link";
import {
  ArrowRight,
  Satellite,
  ShieldCheck,
  Coins,
  Activity,
  Brain,
  Globe2,
  Cpu,
  TreePine,
  Flame,
  CircleCheckBig,
  Store,
} from "lucide-react";
import { HeroGlobe } from "@/components/HeroGlobe";
import { readState } from "@/lib/db";
import { computeStats } from "@/lib/stats";
import { formatHectares, formatTonnes, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const state = readState();
  const stats = computeStats(state);

  return (
    <div className="space-y-24">
      <Hero stats={stats} />
      <ProblemSection />
      <PipelineSection />
      <FeatureGrid />
      <LiveStrip stats={stats} />
      <CtaSection />
    </div>
  );
}

function Hero({ stats }: { stats: ReturnType<typeof computeStats> }) {
  return (
    <section className="relative">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-eco-700/40 bg-eco-500/10 px-3 py-1.5 text-xs font-medium text-eco-300">
            <Satellite size={14} />
            Autonomous Carbon Integrity Network · v1.0
          </div>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Every carbon credit, <br />
            <span className="bg-gradient-to-r from-eco-300 via-eco-400 to-ocean-400 bg-clip-text text-transparent">
              verified from orbit.
            </span>
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/65">
            EcoOracle turns each carbon credit into a dynamic NFT anchored to a
            real GPS coordinate. Our AI vision pipeline analyzes high-resolution
            satellite imagery in a continuous loop, and an autonomous on-chain
            oracle revalues, regenerates, or invalidates credits the instant the
            ground truth changes.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="btn-primary">
              Open Live Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link href="/map" className="btn-secondary">
              Explore the Globe
              <Globe2 size={16} />
            </Link>
            <Link href="/analyze" className="btn-ghost">
              Run an AI scan
              <Brain size={16} />
            </Link>
          </div>
          <div className="mt-2 grid max-w-xl grid-cols-3 gap-3 text-sm">
            <HeroStat label="Parcels under custody" value={formatNumber(stats.totalParcels)} />
            <HeroStat label="Hectares verified" value={formatHectares(stats.totalHectares)} />
            <HeroStat label="CO₂e on-chain" value={formatTonnes(stats.totalTonnesCO2)} />
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <HeroGlobe />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-bg-line bg-bg-card/60 p-3">
      <div className="text-xs uppercase tracking-wider text-white/45">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ProblemSection() {
  const points = [
    {
      icon: <Flame size={18} />,
      title: "Phantom credits.",
      text: "Most credits sold today are projected, not measured. Once a forest burns or is cleared, the credits remain on corporate balance sheets as if nothing happened.",
    },
    {
      icon: <ShieldCheck size={18} />,
      title: "No proof of permanence.",
      text: "Buyers have no way to verify, in real-time, that the trees they paid to protect are still standing two or five years later.",
    },
    {
      icon: <Coins size={18} />,
      title: "Mispriced markets.",
      text: "Every credit is treated as fungible — yet a 30-year mangrove in the Sundarbans and a 1-year sapling are not the same asset.",
    },
  ];
  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          The carbon market has an integrity problem.
        </h2>
        <p className="mt-3 text-white/60">
          Voluntary carbon markets are projected to scale to $100B+ by 2030, but
          recent investigations have shown that the majority of credits in
          circulation may not represent real, additional, verified sequestration.
          That breaks the entire premise of net-zero.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {points.map((p, i) => (
          <div key={i} className="panel p-6">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-danger-500/15 text-danger-400 ring-1 ring-danger-500/30">
              {p.icon}
            </div>
            <h3 className="text-lg font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm text-white/60">{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PipelineSection() {
  const steps = [
    {
      title: "Mint a parcel as dNFT",
      icon: <TreePine size={18} />,
      text:
        "A protected plot of land is geo-fenced, baseline-measured, and minted as an ERC-721 dNFT carrying its baseline tonnes of CO₂e and an initial credit issuance.",
    },
    {
      title: "AI watches from orbit",
      icon: <Satellite size={18} />,
      text:
        "Our vision pipeline ingests Sentinel-2 / Planet imagery continuously and computes NDVI, canopy density, biomass, soil-carbon, moisture, and thermal anomaly indices.",
    },
    {
      title: "Oracle aggregates",
      icon: <Cpu size={18} />,
      text:
        "A decentralized oracle network independently re-runs the model, signs the report, and aggregates a median verified state.",
    },
    {
      title: "Chain reacts in real time",
      icon: <Activity size={18} />,
      text:
        "Credits are minted, burned, or fully invalidated on-chain the instant the ground truth changes. Markets reprice automatically.",
    },
    {
      title: "Buyers retire with proof",
      icon: <CircleCheckBig size={18} />,
      text:
        "Corporates retire credits backed by a complete audit trail — every scan, every state transition, every block.",
    },
  ];
  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between gap-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            How autonomous integrity works.
          </h2>
          <p className="mt-3 text-white/60">
            Five steps, one continuous loop — from satellite pixel to on-chain
            credit, with no human intermediary trusted with the truth.
          </p>
        </div>
      </div>
      <div className="relative panel overflow-hidden p-0">
        <div className="absolute inset-x-6 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-eco-500/40 to-transparent md:block" />
        <ol className="relative grid grid-cols-1 gap-px bg-bg-line/60 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={i} className="relative bg-bg-card/80 p-6">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-eco-700/40 bg-eco-500/10 text-eco-300">
                {s.icon}
              </div>
              <div className="text-xs font-mono text-eco-400/80">
                STEP {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-1 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/60">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    {
      icon: <Brain />,
      title: "Computer-vision biomass model",
      text:
        "Per-ecosystem CNN + segmentation pipeline fuses NDVI, canopy density, soil carbon, moisture and thermal channels into a single tonnes-CO₂e estimate.",
    },
    {
      icon: <Satellite />,
      title: "Sub-hectare GPS anchoring",
      text:
        "Every dNFT carries an explicit polygon. We never aggregate proof across plots — what you protect is what you verify.",
    },
    {
      icon: <ShieldCheck />,
      title: "On-chain invalidation",
      text:
        "Detected wildfire, deforestation or anthropogenic loss instantly burns the corresponding credits. No opaque retirement process.",
    },
    {
      icon: <Coins />,
      title: "Ground-truth pricing",
      text:
        "Credits price from current verified state — health, scarcity, and trajectory. Distressed parcels see prices fall before buyers transact, not after.",
    },
    {
      icon: <Activity />,
      title: "Full audit trail",
      text:
        "Every scan, every block, every state change is queryable. Auditors can reconstruct any credit's lifetime in seconds.",
    },
    {
      icon: <Globe2 />,
      title: "Multi-ecosystem coverage",
      text:
        "Tropical rainforest, mangrove, peatland, boreal, savanna, wetland, agroforestry — each with its own calibrated baseline.",
    },
  ];
  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Built for integrity, end to end.
        </h2>
        <p className="mt-3 text-white/60">
          Every layer of the EcoOracle stack — from the satellite to the smart
          contract — is designed to make manipulation provably hard and proof
          provably easy.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="panel group relative overflow-hidden p-6 transition-colors hover:border-eco-700/60"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-eco-700/40 bg-eco-500/10 text-eco-300">
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-white/60">{f.text}</p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-eco-400 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

function LiveStrip({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const tiles = [
    { label: "Parcels", value: formatNumber(stats.totalParcels) },
    { label: "Active", value: formatNumber(stats.activeParcels) },
    { label: "Warnings", value: formatNumber(stats.warningParcels) },
    { label: "Invalidated", value: formatNumber(stats.invalidatedParcels) },
    { label: "Outstanding credits", value: formatNumber(stats.totalCreditsOutstanding) },
    { label: "Retired credits", value: formatNumber(stats.totalCreditsRetired) },
    { label: "Block height", value: formatNumber(stats.blockHeight) },
  ];
  return (
    <section className="panel grid grid-cols-2 gap-px overflow-hidden bg-bg-line/60 md:grid-cols-4 lg:grid-cols-7">
      {tiles.map((t, i) => (
        <div key={i} className="bg-bg-card/80 p-5">
          <div className="text-xs uppercase tracking-wider text-white/45">
            {t.label}
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {t.value}
          </div>
        </div>
      ))}
    </section>
  );
}

function CtaSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-bg-line bg-gradient-to-br from-bg-card to-bg-soft p-10 md:p-14">
      <div className="absolute inset-0 -z-10 bg-grid-eco opacity-30" />
      <div className="absolute inset-x-10 top-0 h-px glow-line" />
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div>
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to see autonomous carbon integrity in action?
          </h3>
          <p className="mt-3 max-w-2xl text-white/65">
            Open the live dashboard, fire the AI vision engine on any parcel,
            simulate a wildfire, and watch the dNFT credits invalidate
            on-chain — all in your browser.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="btn-primary">
              Launch Dashboard <ArrowRight size={16} />
            </Link>
            <Link href="/marketplace" className="btn-secondary">
              Browse Marketplace <Store size={16} />
            </Link>
          </div>
        </div>
        <div className="relative">
          <pre className="overflow-x-auto rounded-xl border border-bg-line bg-black/40 p-4 text-xs leading-relaxed text-white/80">
{`event OracleStateChanged(
  uint256 tokenId,
  Status  status,
  uint96  tonnesCO2,
  uint96  creditsOutstanding,
  int128  creditsDelta,
  uint64  pricePerCreditE2,
  bytes32 scanCid
);`}
          </pre>
          <div className="mt-3 text-xs text-white/40">
            From <span className="font-mono text-eco-400">CarbonCreditDNFT.sol</span> — emitted whenever the AI verifies a state change.
          </div>
        </div>
      </div>
    </section>
  );
}
