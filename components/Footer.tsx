import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-bg-line/60 bg-bg-soft/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
            EcoOracle is the autonomous carbon integrity layer for the planet.
            Every credit is a dynamic NFT anchored to a real GPS coordinate,
            verified continuously by AI satellite analysis, and revalued on
            chain in response to ground truth.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            Network
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link className="hover:text-eco-300" href="/dashboard">Dashboard</Link></li>
            <li><Link className="hover:text-eco-300" href="/map">Live Map</Link></li>
            <li><Link className="hover:text-eco-300" href="/marketplace">Marketplace</Link></li>
            <li><Link className="hover:text-eco-300" href="/oracle">Oracle Log</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            Protocol
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link className="hover:text-eco-300" href="/analyze">AI Vision Engine</Link></li>
            <li><Link className="hover:text-eco-300" href="/portfolio">Portfolios</Link></li>
            <li><span className="text-white/40">v1.0.0 — Devnet</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bg-line/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-5 py-5 text-xs text-white/40 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} EcoOracle Network — Autonomous Carbon Integrity</span>
          <span>
            Block height tracked locally · No real funds at risk
          </span>
        </div>
      </div>
    </footer>
  );
}
