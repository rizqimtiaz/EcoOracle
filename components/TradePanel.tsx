"use client";

import { useEffect, useState, useTransition } from "react";
import { CarbonParcel, Portfolio } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  formatNumber,
  formatUsd,
} from "@/lib/format";
import { Coins, Recycle, Loader2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  parcel: CarbonParcel;
}

export function TradePanel({ parcel }: Props) {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [mode, setMode] = useState<"buy" | "retire">("buy");
  const [credits, setCredits] = useState(100);
  const [buyer, setBuyer] = useState<string>("");
  const [beneficiary, setBeneficiary] = useState("");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then((d) => {
        const ps: Portfolio[] = d.portfolios;
        setPortfolios(ps);
        // Default buyer = first non-owner portfolio.
        const first = ps.find((p) => p.address !== parcel.owner) ?? ps[0];
        if (first) {
          setBuyer(first.address);
          setBeneficiary(first.label);
        }
      });
  }, [parcel.owner]);

  const disabled = parcel.status === "invalidated";
  const total = credits * parcel.pricePerCredit;
  const max = mode === "buy"
    ? parcel.creditsOutstanding
    : (() => {
        const p = portfolios.find((pp) => pp.address === buyer);
        const h = p?.holdings.find((h) => h.tokenId === parcel.tokenId);
        return h?.credits ?? 0;
      })();

  async function submit() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          tokenId: parcel.tokenId,
          buyerAddress: buyer,
          credits,
          beneficiary: mode === "retire" ? beneficiary : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: json.error ?? "Trade failed." });
      } else {
        setMessage({
          type: "ok",
          text:
            mode === "buy"
              ? `Acquired ${credits.toLocaleString()} credits for ${formatUsd(total)}.`
              : `Retired ${credits.toLocaleString()} credits on behalf of ${beneficiary}.`,
        });
        startTransition(() => router.refresh());
      }
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Network error.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Trade & Retire</h3>
          <p className="text-xs text-white/50">
            All actions emit on-chain events with a tx hash & block.
          </p>
        </div>
        <div className="flex rounded-lg border border-bg-line bg-bg-soft p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("buy")}
            className={cn(
              "rounded-md px-3 py-1 transition-colors",
              mode === "buy"
                ? "bg-eco-500/15 text-eco-300"
                : "text-white/60 hover:text-white",
            )}
          >
            <Coins size={12} className="mr-1 inline" />
            Buy
          </button>
          <button
            type="button"
            onClick={() => setMode("retire")}
            className={cn(
              "rounded-md px-3 py-1 transition-colors",
              mode === "retire"
                ? "bg-eco-500/15 text-eco-300"
                : "text-white/60 hover:text-white",
            )}
          >
            <Recycle size={12} className="mr-1 inline" />
            Retire
          </button>
        </div>
      </div>

      {disabled ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-white/55">
          <X className="text-danger-400" />
          This dNFT is invalidated. Trading is disabled by the smart contract.
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/55">
              Wallet
            </label>
            <select
              value={buyer}
              onChange={(e) => {
                setBuyer(e.target.value);
                const p = portfolios.find((pp) => pp.address === e.target.value);
                if (p) setBeneficiary(p.label);
              }}
              className="w-full rounded-lg border border-bg-line bg-bg-soft px-3 py-2 text-sm focus:border-eco-700 focus:outline-none"
            >
              {portfolios.map((p) => (
                <option key={p.address} value={p.address}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 flex items-center justify-between text-xs text-white/55">
              <span>Credits ({mode === "buy" ? "available to acquire" : "available to retire"})</span>
              <span className="font-mono text-white/70">
                Max: {formatNumber(max)}
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={max}
              value={credits}
              onChange={(e) =>
                setCredits(Math.max(1, Math.min(max, parseInt(e.target.value || "0", 10))))
              }
              className="w-full rounded-lg border border-bg-line bg-bg-soft px-3 py-2 text-sm tabular-nums focus:border-eco-700 focus:outline-none"
            />
            <input
              type="range"
              min={1}
              max={Math.max(1, max)}
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value, 10))}
              className="mt-2 w-full accent-eco-500"
            />
          </div>

          {mode === "retire" && (
            <div>
              <label className="mb-1 block text-xs text-white/55">
                Retire on behalf of
              </label>
              <input
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="Acme Aviation Net-Zero 2030"
                className="w-full rounded-lg border border-bg-line bg-bg-soft px-3 py-2 text-sm focus:border-eco-700 focus:outline-none"
              />
            </div>
          )}

          <div className="rounded-lg border border-bg-line bg-bg-soft/60 p-3 text-sm">
            <Row label="Price / credit" value={formatUsd(parcel.pricePerCredit)} />
            <Row label="Credits" value={credits.toLocaleString()} />
            <Row label="Total" value={formatUsd(total)} accent />
          </div>

          {message && (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                message.type === "ok"
                  ? "border-eco-700/40 bg-eco-500/10 text-eco-300"
                  : "border-danger-600/40 bg-danger-500/10 text-danger-400",
              )}
            >
              {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={busy || pending || credits <= 0 || credits > max}
            className="btn-primary w-full justify-center"
          >
            {busy || pending ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
            {mode === "buy" ? "Acquire credits" : "Retire credits"}
          </button>
          <p className="text-[11px] text-white/40">
            All transactions are simulated on a local devnet. No real funds.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-white/60">{label}</span>
      <span className={cn("tabular-nums", accent ? "font-semibold text-eco-300" : "text-white/85")}>
        {value}
      </span>
    </div>
  );
}
