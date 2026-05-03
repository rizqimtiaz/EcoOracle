export function formatNumber(v: number, fractionDigits = 0): string {
  return v.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatTonnes(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}Mt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}kt`;
  return `${v.toFixed(0)}t`;
}

export function formatHectares(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M ha`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k ha`;
  return `${v.toFixed(0)} ha`;
}

export function formatUsd(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatPct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function shortHash(hash: string, head = 8, tail = 6): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function ecosystemLabel(e: string): string {
  return e
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function statusLabel(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

export function classFor(status: string): {
  bg: string;
  text: string;
  ring: string;
  dot: string;
  label: string;
} {
  switch (status) {
    case "active":
      return {
        bg: "bg-eco-500/15",
        text: "text-eco-300",
        ring: "ring-eco-500/30",
        dot: "bg-eco-400",
        label: "Active",
      };
    case "warning":
      return {
        bg: "bg-warn-500/15",
        text: "text-warn-400",
        ring: "ring-warn-500/30",
        dot: "bg-warn-400",
        label: "Warning",
      };
    case "invalidated":
      return {
        bg: "bg-danger-500/15",
        text: "text-danger-400",
        ring: "ring-danger-500/30",
        dot: "bg-danger-400",
        label: "Invalidated",
      };
    case "regenerating":
      return {
        bg: "bg-ocean-500/15",
        text: "text-ocean-400",
        ring: "ring-ocean-500/30",
        dot: "bg-ocean-400",
        label: "Regenerating",
      };
    case "pending":
    default:
      return {
        bg: "bg-white/5",
        text: "text-white/60",
        ring: "ring-white/10",
        dot: "bg-white/40",
        label: "Pending",
      };
  }
}
