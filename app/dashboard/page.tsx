import { readState } from "@/lib/db";
import { computeStats, networkTimeseries, totalsByEcosystem } from "@/lib/stats";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Coins,
  Trees,
  Recycle,
  Layers,
  Cpu,
} from "lucide-react";
import {
  formatHectares,
  formatNumber,
  formatTonnes,
  formatUsd,
} from "@/lib/format";
import { NetworkAreaChart } from "@/components/charts/NetworkAreaChart";
import { StatusStackedChart } from "@/components/charts/StatusStackedChart";
import { EcosystemBars } from "@/components/charts/EcosystemBars";
import { EventLog } from "@/components/EventLog";
import Link from "next/link";
import { RunOracleButton } from "@/components/RunOracleButton";
import { ResetNetworkButton } from "@/components/ResetNetworkButton";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const state = readState();
  const stats = computeStats(state);
  const ts = networkTimeseries(state, 30);
  const ecosystems = totalsByEcosystem(state);
  const events = state.events.slice(0, 8);

  // Trend: change vs ~7 days ago.
  const recent = ts[ts.length - 1]?.tonnesCO2 ?? 0;
  const prior = ts[Math.max(0, ts.length - 8)]?.tonnesCO2 ?? recent;
  const trendPct = prior === 0 ? 0 : ((recent - prior) / prior) * 100;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Network Control"
        title="EcoOracle Dashboard"
        description="Live state of the autonomous carbon integrity network: every parcel, every credit, every block."
        actions={
          <>
            <RunOracleButton />
            <ResetNetworkButton />
          </>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="Verified CO₂e"
          value={formatTonnes(stats.totalTonnesCO2)}
          hint={`${formatHectares(stats.totalHectares)} under custody`}
          icon={<Cpu size={18} />}
          trend={{ value: Number(trendPct.toFixed(2)) }}
        />
        <StatTile
          label="Outstanding credits"
          value={formatNumber(stats.totalCreditsOutstanding)}
          hint={`avg price ${formatUsd(stats.averagePricePerCredit)}`}
          icon={<Coins size={18} />}
        />
        <StatTile
          label="Retired credits"
          value={formatNumber(stats.totalCreditsRetired)}
          hint="permanent offsets"
          icon={<Recycle size={18} />}
        />
        <StatTile
          label="Block height"
          value={formatNumber(stats.blockHeight)}
          hint={`${state.events.length} events in log`}
          icon={<Layers size={18} />}
        />
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatusCard
          label="Active"
          value={stats.activeParcels}
          total={stats.totalParcels}
          icon={<CheckCircle2 size={16} />}
          status="active"
        />
        <StatusCard
          label="Warning"
          value={stats.warningParcels}
          total={stats.totalParcels}
          icon={<AlertTriangle size={16} />}
          status="warning"
        />
        <StatusCard
          label="Regenerating"
          value={stats.regeneratingParcels}
          total={stats.totalParcels}
          icon={<Recycle size={16} />}
          status="regenerating"
        />
        <StatusCard
          label="Invalidated"
          value={stats.invalidatedParcels}
          total={stats.totalParcels}
          icon={<XCircle size={16} />}
          status="invalidated"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Verified CO₂e — last 30 days</h3>
              <p className="text-xs text-white/50">
                Aggregated tonnes across all parcels per AI scan, snapshotted daily.
              </p>
            </div>
            <span className="badge bg-eco-500/10 text-eco-300 ring-eco-500/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-eco-400" />
              Live
            </span>
          </div>
          <NetworkAreaChart data={ts} />
        </div>
        <div className="panel p-6">
          <h3 className="text-base font-semibold">Network composition</h3>
          <p className="text-xs text-white/50">
            Verified CO₂e by ecosystem type.
          </p>
          <div className="mt-5">
            <EcosystemBars data={ecosystems} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Parcel health distribution</h3>
              <p className="text-xs text-white/50">
                Daily breakdown of active vs. distressed parcels.
              </p>
            </div>
          </div>
          <StatusStackedChart data={ts} />
        </div>
        <div className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Latest oracle events</h3>
            <Link
              href="/oracle"
              className="text-xs font-medium text-eco-300 hover:text-eco-200"
            >
              View all →
            </Link>
          </div>
          <EventLog events={events} />
        </div>
      </section>

      <section className="panel p-0">
        <div className="flex items-center justify-between border-b border-bg-line/60 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold">Top parcels by verified tonnage</h3>
            <p className="text-xs text-white/50">
              Sorted by current verified CO₂e. Click a row to inspect.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="text-xs font-medium text-eco-300 hover:text-eco-200"
          >
            Open marketplace →
          </Link>
        </div>
        <ParcelTable parcels={state.parcels.slice().sort((a, b) => b.currentTonnesCO2 - a.currentTonnesCO2).slice(0, 8)} />
      </section>
    </div>
  );
}

function StatusCard({
  label,
  value,
  total,
  icon,
  status,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  status: string;
}) {
  const pct = total === 0 ? 0 : (value / total) * 100;
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <StatusPill status={status} />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-sm text-white/45">/ {total}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-line">
        <div
          className="h-full rounded-full bg-eco-500/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-white/45">
        {icon}
        {pct.toFixed(1)}% of network
      </div>
    </div>
  );
}

function ParcelTable({
  parcels,
}: {
  parcels: ReturnType<typeof readState>["parcels"];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-12 gap-3 border-b border-bg-line/60 px-6 py-3 text-[11px] uppercase tracking-wider text-white/45">
        <div className="col-span-4">Parcel</div>
        <div className="col-span-2">Region</div>
        <div className="col-span-1 text-right">Tonnes</div>
        <div className="col-span-2 text-right">Credits</div>
        <div className="col-span-1 text-right">Price</div>
        <div className="col-span-2">Status</div>
      </div>
      {parcels.map((p) => (
        <Link
          key={p.id}
          href={`/marketplace/${p.tokenId}`}
          className="grid grid-cols-12 items-center gap-3 border-b border-bg-line/40 px-6 py-3 text-sm transition-colors hover:bg-white/[0.02]"
        >
          <div className="col-span-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-eco-500/10 text-eco-300 ring-1 ring-eco-500/20">
              <Trees size={14} />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-white">{p.name}</div>
              <div className="font-mono text-[11px] text-white/40">
                #{p.tokenId} · {formatHectares(p.hectares)}
              </div>
            </div>
          </div>
          <div className="col-span-2 truncate text-white/65">{p.region}</div>
          <div className="col-span-1 text-right tabular-nums text-white/90">
            {formatTonnes(p.currentTonnesCO2)}
          </div>
          <div className="col-span-2 text-right tabular-nums text-white/80">
            {formatNumber(p.creditsOutstanding)}
          </div>
          <div className="col-span-1 text-right tabular-nums text-white/70">
            {formatUsd(p.pricePerCredit)}
          </div>
          <div className="col-span-2">
            <StatusPill status={p.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
