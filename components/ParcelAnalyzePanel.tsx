"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Sprout, Trees, Flame, Recycle } from "lucide-react";
import { OracleEvent, SatelliteScanReport } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatPct } from "@/lib/format";

type EventKind = "normal" | "growth" | "deforestation" | "fire" | "regeneration";

const PRESETS: { id: EventKind; label: string; icon: React.ElementType; color: string }[] = [
  { id: "normal", label: "Routine scan", icon: Sparkles, color: "text-white/70" },
  { id: "growth", label: "Healthy growth", icon: Sprout, color: "text-eco-300" },
  { id: "deforestation", label: "Deforestation", icon: Trees, color: "text-warn-400" },
  { id: "fire", label: "Wildfire", icon: Flame, color: "text-danger-400" },
  { id: "regeneration", label: "Regeneration", icon: Recycle, color: "text-ocean-400" },
];

interface Result {
  scan: SatelliteScanReport;
  events: OracleEvent[];
}

interface Props {
  parcelId: string;
}

export function ParcelAnalyzePanel({ parcelId }: Props) {
  const router = useRouter();
  const [forceEvent, setForceEvent] = useState<EventKind>("normal");
  const [magnitude, setMagnitude] = useState(0.5);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId,
          forceEvent,
          magnitude,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Scan failed.");
      } else {
        setResult(json);
        startTransition(() => router.refresh());
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Run AI vision scan</h3>
          <p className="text-xs text-white/50">
            Inject an event to see the oracle re-price on-chain in real time.
          </p>
        </div>
        <span className="badge bg-eco-500/10 text-eco-300 ring-eco-500/20">
          <Sparkles size={12} />
          v1.0
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const active = forceEvent === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setForceEvent(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                active
                  ? "border-eco-700/60 bg-eco-500/10 text-white"
                  : "border-bg-line bg-bg-soft/40 text-white/65 hover:bg-white/[0.03]",
              )}
            >
              <Icon size={14} className={p.color} />
              {p.label}
            </button>
          );
        })}
      </div>
      {forceEvent !== "normal" && (
        <div className="mt-3">
          <label className="mb-1 flex items-center justify-between text-xs text-white/55">
            <span>Magnitude</span>
            <span className="font-mono text-white/70">
              {(magnitude * 100).toFixed(0)}%
            </span>
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={magnitude}
            onChange={(e) => setMagnitude(parseFloat(e.target.value))}
            className="w-full accent-eco-500"
          />
        </div>
      )}
      <button
        type="button"
        onClick={run}
        disabled={busy || pending}
        className="btn-primary mt-4 w-full justify-center"
      >
        {busy || pending ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Sparkles size={16} />
        )}
        Trigger AI scan + oracle update
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-danger-600/40 bg-danger-500/10 px-3 py-2 text-xs text-danger-400">
          {error}
        </div>
      )}

      {result && !error && (
        <div className="mt-4 space-y-2">
          <div className="text-xs uppercase tracking-wider text-white/45">
            Latest report
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <Mini label="NDVI" value={formatPct(result.scan.ndvi)} />
            <Mini label="Canopy" value={formatPct(result.scan.canopyDensity)} />
            <Mini label="Biomass" value={formatPct(result.scan.biomassIndex)} />
          </div>
          <ul className="space-y-1 rounded-lg border border-bg-line bg-bg-soft/40 p-2 text-[11px]">
            {result.scan.notes.map((n, i) => (
              <li key={i} className="text-white/65">
                · {n}
              </li>
            ))}
          </ul>
          {result.events.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-eco-700/30 bg-eco-500/5 p-2 text-[11px]"
            >
              <div className="font-medium text-eco-300">
                {e.kind} event emitted on chain
              </div>
              <div className="text-white/65">{e.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-bg-line bg-bg-soft/40 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="font-mono tabular-nums text-white/85">{value}</div>
    </div>
  );
}
