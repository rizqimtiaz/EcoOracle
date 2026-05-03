"use client";

import { useEffect, useMemo, useState } from "react";
import { ChainTx, OracleEvent } from "@/lib/types";
import { SectionHeader } from "@/components/SectionHeader";
import { EventLog } from "@/components/EventLog";
import { RunOracleButton } from "@/components/RunOracleButton";
import { shortHash, timeAgo } from "@/lib/format";
import { Activity, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";

const KINDS = [
  "All",
  "MINT",
  "SCAN",
  "GROWTH",
  "DEFORESTATION",
  "FIRE",
  "INVALIDATION",
  "REGENERATION",
  "TRANSFER",
  "RETIRE",
];

export default function OraclePage() {
  const [events, setEvents] = useState<OracleEvent[]>([]);
  const [txs, setTxs] = useState<ChainTx[]>([]);
  const [filter, setFilter] = useState("All");
  const [tab, setTab] = useState<"events" | "tx">("events");

  useEffect(() => {
    const load = () => {
      Promise.all([
        fetch("/api/events?limit=200").then((r) => r.json()),
        fetch("/api/transactions?limit=200").then((r) => r.json()),
      ]).then(([e, t]) => {
        setEvents(e.events);
        setTxs(t.transactions);
      });
    };
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return events;
    return events.filter((e) => e.kind === filter);
  }, [events, filter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Autonomous Oracle"
        title="Network event log"
        description="Every state change written by the EcoOracle node — mints, AI scans, growth, deforestation, fire, invalidation, transfers, retirements."
        actions={<RunOracleButton />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile
          label="Events recorded"
          value={events.length.toLocaleString()}
          icon={<Activity size={16} />}
        />
        <SummaryTile
          label="Last block"
          value={txs[0]?.blockNumber.toLocaleString() ?? "—"}
          icon={<ScanLine size={16} />}
        />
        <SummaryTile
          label="Recent invalidations"
          value={events.filter((e) => e.kind === "INVALIDATION").length.toString()}
          tone="danger"
        />
        <SummaryTile
          label="Recent regenerations"
          value={events.filter((e) => e.kind === "REGENERATION").length.toString()}
          tone="ocean"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-bg-line bg-bg-soft p-1 text-xs">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 transition-colors",
              tab === "events"
                ? "bg-eco-500/15 text-eco-300"
                : "text-white/60 hover:text-white",
            )}
            onClick={() => setTab("events")}
          >
            Oracle events
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 transition-colors",
              tab === "tx" ? "bg-eco-500/15 text-eco-300" : "text-white/60 hover:text-white",
            )}
            onClick={() => setTab("tx")}
          >
            Raw transactions
          </button>
        </div>
        {tab === "events" && (
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={
                  "rounded-full border px-2.5 py-1 text-[11px] transition-colors " +
                  (filter === k
                    ? "border-eco-700/60 bg-eco-500/15 text-eco-300"
                    : "border-bg-line text-white/60 hover:bg-white/5")
                }
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "events" && (
        <div className="panel p-4 md:p-6">
          <EventLog events={filtered} />
        </div>
      )}

      {tab === "tx" && (
        <div className="panel overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-3 border-b border-bg-line/60 px-6 py-3 text-[11px] uppercase tracking-wider text-white/45">
            <div className="col-span-3">Tx hash</div>
            <div className="col-span-1 text-right">Block</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">From</div>
            <div className="col-span-2">To</div>
            <div className="col-span-1 text-right">Gas</div>
            <div className="col-span-1 text-right">When</div>
          </div>
          {txs.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-white/45">
              No transactions yet.
            </div>
          )}
          {txs.map((t) => (
            <div
              key={t.hash}
              className="grid grid-cols-12 items-center gap-3 border-b border-bg-line/40 px-6 py-3 text-sm last:border-0"
            >
              <div className="col-span-3 font-mono text-xs text-eco-300">
                {shortHash(t.hash, 10, 8)}
              </div>
              <div className="col-span-1 text-right tabular-nums text-white/85">
                {t.blockNumber.toLocaleString()}
              </div>
              <div className="col-span-2">
                <span className="rounded bg-bg-soft px-2 py-0.5 font-mono text-[11px] text-white/80">
                  {t.method}
                </span>
              </div>
              <div className="col-span-2 truncate font-mono text-[11px] text-white/55">
                {shortHash(t.from)}
              </div>
              <div className="col-span-2 truncate font-mono text-[11px] text-white/55">
                {shortHash(t.to)}
              </div>
              <div className="col-span-1 text-right tabular-nums text-white/55">
                {t.gasUsed.toLocaleString()}
              </div>
              <div className="col-span-1 text-right text-white/45">
                {timeAgo(t.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "danger" | "ocean";
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && (
          <span
            className={
              tone === "danger"
                ? "text-danger-400"
                : tone === "ocean"
                  ? "text-ocean-400"
                  : "text-eco-300"
            }
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
