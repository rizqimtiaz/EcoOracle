"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Globe2,
  Store,
  Activity,
  Wallet,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Live Map", icon: Globe2 },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/analyze", label: "AI Vision", icon: Sparkles },
  { href: "/oracle", label: "Oracle", icon: Activity },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors",
        scrolled
          ? "border-b border-bg-line/80 bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-eco-300"
                    : "text-white/65 hover:text-white",
                )}
              >
                <Icon size={15} className="opacity-80" />
                {item.label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-eco-400 to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-lg border border-eco-700/60 bg-eco-500/10 px-3 py-1.5 text-xs font-medium text-eco-300 transition-colors hover:bg-eco-500/20 sm:inline-flex"
          >
            <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-eco-400" />
            Live network
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-lg border border-bg-line bg-bg-panel/60 p-2 text-white/80"
            aria-label="Toggle navigation"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-bg-line/60 bg-bg/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-3 py-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm",
                    active
                      ? "bg-eco-500/10 text-eco-300"
                      : "text-white/75 hover:bg-white/5",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
