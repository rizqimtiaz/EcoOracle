"use client";

import { useState, useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

interface Props {
  className?: string;
}

export function ResetNetworkButton({ className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);

  async function run() {
    if (!confirm("Reset the EcoOracle demo network to its seeded state?")) return;
    setRunning(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      startTransition(() => router.refresh());
    } finally {
      setRunning(false);
    }
  }

  const isBusy = running || pending;
  return (
    <button
      type="button"
      onClick={run}
      disabled={isBusy}
      className={cn("btn-secondary", className)}
    >
      {isBusy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
      Reset Network
    </button>
  );
}
