"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CarbonParcel, Portfolio } from "@/lib/types";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  ecosystemLabel,
  formatNumber,
  formatPct,
  formatTonnes,
  formatUsd,
  shortHash,
  timeAgo,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  Wallet,
  Coins,
  Recycle,
  ShieldCheck,
  TreePine,
  ArrowRight,
} from "lucide-react";

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [parcels, setParcels] = useState<CarbonParcel[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/portfolios").then((r) => r.json()),
      fetch("/api/parcels").then((r) => r.json()),
    ]).then(([p, q]) => {
      setPortfolios(p.portfolios);
      setParcels(q.parcels);
      if (p.portfolios.length > 0) setActive(p.portfolios[0].address);
    });
  }, []);

  const activePortfolio = useMemo(
    () => portfolios.find((p) => p.address === active) ?? null,
    [portfolios, active],
  );

  const holdings = useMemo(() => {
    if (!activePortfolio) return [];
    return activePortfolio.holdings
      .map((h) => {
        const parcel = parcels.find((p) => p.tokenId === h.tokenId);
        return parcel ? { holding: h, parcel } : null;
      })
      .filter((x): x is { holding: typeof activePortfolio.holdings[0]; parcel: CarbonParcel } => Boolean(x))
      .sort((a, b) => b.holding.credits - a.holding.credits);
  }, [activePortfolio, parcels]);

  const totals = useMemo(() => {
    let credits = 0;
    let valueUsd = 0;
    let costUsd = 0;
    let healthy = 0;
    let stressed = 0;
    let invalidated = 0;
    for (const { holding, parcel } of holdings) {
      credits += holding.credits;
      valueUsd += holding.credits * parcel.pricePerCredit;
      costUsd += holding.costBasisUsd;
      if (parcel.status === "active" || parcel.status === "regenerating") healthy += holding.credits;
      else if (parcel.status === "warning") stressed += holding.credits;
      else if (parcel.status === "invalidated") invalidated += holding.credits;
    }
    return {
      credits,
      valueUsd,
      costUsd,
      pl: valueUsd - costUsd,
      healthy,
      stressed,
      invalidated,
      retired: activePortfolio?.totalRetired ?? 0,
    };
  }, [holdings, activePortfolio]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Portfolio"
        title="Wallet & holdings"
        description="Each wallet holds dynamic carbon credit dNFTs. Values revalue automatically as the AI verifies new scans."
      />

      <div className="flex flex-wrap gap-2">
        {portfolios.map((p) => {
          const isActive = p.address === active;
          return (
            <button
              key={p.address}
              type="button"
              onClick={() => setActive(p.address)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "border-eco-700/60 bg-eco-500/10 text-eco-200"
                  : "border-bg-line bg-bg-soft text-white/65 hover:bg-white/5",
              )}
            >
              <Wallet size={12} />
              {p.label}
            </button>
          );
        })}
      </div>

      {activePortfolio ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile
              label="Total credits"
              value={formatNumber(totals.credits)}
              hint={`${holdings.length} parcel${holdings.length === 1 ? "" : "s"}`}
              icon={<Coins size={16} />}
            />
            <Tile
              label="Portfolio value"
              value={formatUsd(totals.valueUsd)}
              hint={
                totals.costUsd > 0 ? (
                  <span className={cn(totals.pl >= 0 ? "text-eco-300" : "text-danger-400")}>
                    {totals.pl >= 0 ? "+" : ""}
                    {formatUsd(totals.pl)} vs. cost basis
                  </span>
                ) : null
              }
              icon={<ShieldCheck size={16} />}
            />
            <Tile
              label="Retired credits"
              value={formatNumber(totals.retired)}
              hint="Permanent offsets"
              icon={<Recycle size={16} />}
            />
            <Tile
              label="Wallet"
              value={
                <span className="font-mono text-base">
                  {shortHash(activePortfolio.address, 8, 6)}
                </span>
              }
              hint={activePortfolio.label}
              icon={<Wallet size={16} />}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Distribution label="Healthy credits" value={totals.healthy} total={totals.credits} color="bg-eco-500" />
            <Distribution label="At-risk credits" value={totals.stressed} total={totals.credits} color="bg-warn-500" />
            <Distribution label="Invalidated credits" value={totals.invalidated} total={totals.credits} color="bg-danger-500" />
          </div>

          <div className="panel overflow-hidden p-0">
            <div className="border-b border-bg-line/60 px-6 py-4">
              <h3 className="text-base font-semibold">Holdings</h3>
              <p className="text-xs text-white/55">
                Click a row to inspect the parcel and trade.
              </p>
            </div>
            <div className="grid grid-cols-12 gap-3 border-b border-bg-line/60 px-6 py-3 text-[11px] uppercase tracking-wider text-white/45">
              <div className="col-span-4">Parcel</div>
              <div className="col-span-2">Acquired</div>
              <div className="col-span-1 text-right">Credits</div>
              <div className="col-span-2 text-right">Value</div>
              <div className="col-span-2 text-right">Cost basis</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            {holdings.length === 0 && (
              <div className="flex h-40 items-center justify-center text-sm text-white/55">
                This wallet has no holdings.
              </div>
            )}
            {holdings.map(({ holding, parcel }) => {
              const value = holding.credits * parcel.pricePerCredit;
              return (
                <Link
                  key={holding.tokenId}
                  href={`/marketplace/${parcel.tokenId}`}
                  className="grid grid-cols-12 items-center gap-3 border-b border-bg-line/40 px-6 py-3 text-sm transition-colors hover:bg-white/[0.02]"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-eco-500/10 text-eco-300 ring-1 ring-eco-500/20">
                      <TreePine size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">
                        {parcel.name}
                      </div>
                      <div className="text-[11px] text-white/45">
                        #{parcel.tokenId} · {ecosystemLabel(parcel.ecosystem)} · {formatTonnes(parcel.currentTonnesCO2)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-white/65">{timeAgo(holding.acquiredAt)}</div>
                  <div className="col-span-1 text-right tabular-nums text-white/90">
                    {formatNumber(holding.credits)}
                  </div>
                  <div className="col-span-2 text-right tabular-nums text-eco-300">
                    {formatUsd(value)}
                  </div>
                  <div className="col-span-2 text-right tabular-nums text-white/65">
                    {formatUsd(holding.costBasisUsd)}
                  </div>
                  <div className="col-span-1 text-right">
                    <StatusPill status={parcel.status} />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Net-zero exposure</h3>
                <p className="text-xs text-white/55">
                  Estimate of how this wallet's holdings + retirements offset annual emissions.
                </p>
              </div>
              <Link
                href="/marketplace"
                className="text-xs font-medium text-eco-300 hover:text-eco-200"
              >
                Buy more credits
                <ArrowRight size={12} className="ml-1 inline" />
              </Link>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-eco-500 to-ocean-500"
                style={{
                  width: `${Math.min(100, ((totals.credits + totals.retired) / 100_000) * 100).toFixed(1)}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/45">
              <span>
                Net coverage: {formatNumber(totals.credits + totals.retired)} t CO₂e
              </span>
              <span>
                {formatPct(Math.min(1, (totals.credits + totals.retired) / 100_000))} of 100kt target
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="panel flex h-40 items-center justify-center text-white/55">
          Select a wallet to view holdings.
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-eco-300/80">{icon}</span>}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/45">{hint}</div>}
    </div>
  );
}

function Distribution({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : (value / total) * 100;
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between text-xs text-white/55">
        <span>{label}</span>
        <span className="tabular-nums text-white/85">
          {formatNumber(value)} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-line">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
