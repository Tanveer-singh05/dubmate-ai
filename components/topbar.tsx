"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "./ui/button";
import { toast } from "./ui/toast";
import { ThemeToggle } from "./theme-toggle";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    toast("Signed out", "success");
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="border-b border-border/60 bg-bg/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="md:hidden w-9 h-9 rounded-md flex items-center justify-center text-muted hover:text-fg hover:bg-card transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <span className="text-sm text-muted">
            {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Loading..."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-card transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center text-primary text-[11px] font-semibold">
                {initials}
              </div>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-40 p-1.5">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs text-muted">Signed in as</p>
                    <p className="text-sm font-medium truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} /> Sign out
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}