"use client";

import { useState, useTransition } from "react";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

interface Props {
  className?: string;
}

export function RunOracleButton({ className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ scans: number; mutated: number } | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/oracle/run", { method: "POST" });
      const json = await res.json();
      setResult({ scans: json.scans, mutated: json.mutated });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setRunning(false);
    }
  }

  const isBusy = running || pending;
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <button
        type="button"
        onClick={run}
        disabled={isBusy}
        className="btn-primary"
      >
        {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
        Run Oracle Sweep
      </button>
      {result && (
        <div className="flex items-center gap-2 text-xs text-white/60">
          <RefreshCw size={12} className="text-eco-400" />
          {result.scans} scans · {result.mutated} on-chain updates
        </div>
      )}
    </div>
  );
}
