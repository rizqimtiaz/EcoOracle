"use client";

import { OracleEvent } from "@/lib/types";
import { shortHash, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  Activity,
  ArrowDownUp,
  Coins,
  Flame,
  Sprout,
  Trees,
  Recycle,
  Sparkles,
  XCircle,
  ScanLine,
} from "lucide-react";
import Link from "next/link";

const ICONS: Record<OracleEvent["kind"], React.ElementType> = {
  MINT: Sparkles,
  SCAN: ScanLine,
  GROWTH: Sprout,
  DEFORESTATION: Trees,
  FIRE: Flame,
  INVALIDATION: XCircle,
  REGENERATION: Recycle,
  TRANSFER: ArrowDownUp,
  RETIRE: Coins,
};

const COLORS: Record<OracleEvent["kind"], string> = {
  MINT: "text-eco-300 bg-eco-500/15 ring-eco-500/30",
  SCAN: "text-white/70 bg-white/5 ring-white/10",
  GROWTH: "text-eco-300 bg-eco-500/15 ring-eco-500/30",
  DEFORESTATION: "text-warn-400 bg-warn-500/15 ring-warn-500/30",
  FIRE: "text-danger-400 bg-danger-500/15 ring-danger-500/30",
  INVALIDATION: "text-danger-400 bg-danger-500/15 ring-danger-500/30",
  REGENERATION: "text-ocean-400 bg-ocean-500/15 ring-ocean-500/30",
  TRANSFER: "text-white/80 bg-white/5 ring-white/10",
  RETIRE: "text-eco-300 bg-eco-500/15 ring-eco-500/30",
};

interface Props {
  events: OracleEvent[];
  emptyText?: string;
  showParcelLink?: boolean;
}

export function EventLog({ events, emptyText, showParcelLink = true }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-white/45">
        {emptyText ?? "No events yet."}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-bg-line/60">
      {events.map((e) => {
        const Icon = ICONS[e.kind] ?? Activity;
        return (
          <li key={e.id} className="flex items-start gap-4 py-3">
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                COLORS[e.kind],
              )}
            >
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-white/90">{e.kind}</span>
                  {showParcelLink && (
                    <Link
                      href={`/marketplace/${e.tokenId}`}
                      className="rounded-md border border-bg-line bg-bg-panel px-1.5 py-0.5 font-mono text-[11px] text-eco-300 hover:bg-eco-500/10"
                    >
                      #{e.tokenId}
                    </Link>
                  )}
                  <span className="font-mono text-[11px] text-white/40">
                    blk {e.blockNumber.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-white/45">
                  {timeAgo(e.timestamp)}
                </span>
              </div>
              <div className="mt-0.5 text-sm text-white/65">{e.message}</div>
              <div className="mt-1 font-mono text-[11px] text-white/30">
                tx {shortHash(e.txHash, 10, 8)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
