"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, KeyRound, Film, Sparkles, X, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRuntimeMode } from "@/lib/runtime-mode";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Studio", icon: Film },
  { href: "/keys", label: "API Keys", icon: KeyRound },
  { href: "/billing", label: "Credits", icon: Coins },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { features } = useRuntimeMode();
  const isLocal = features ? !features.show_credits : false;
  const visibleItems = isLocal
    ? items.filter((it) => it.href !== "/billing")
    : items;
  const nav = (
    <>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <Sparkles size={14} className="text-primary-fg" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-tight">DubMate AI</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-muted hover:text-fg transition-colors p-1"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-card hover:text-fg"
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-[11px] text-muted tracking-tight">
          DubMate AI · v0.1
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible at md and up */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/30 backdrop-blur shrink-0">
        {nav}
      </aside>

      {/* Mobile slide-over */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />

        {/* Panel */}
        <aside
          className={cn(
            "absolute left-0 top-0 bottom-0 w-64 flex flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}