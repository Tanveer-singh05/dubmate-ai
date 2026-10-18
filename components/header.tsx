"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="border-b border-border/60 backdrop-blur-xl bg-bg/70 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/favicon.ico" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-[15px] tracking-tight">
            DubMate AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="#features" className="text-muted hover:text-fg transition-colors">
            Features
          </Link>
          <Link href="#how" className="text-muted hover:text-fg transition-colors">
            How it Works
          </Link>
          <Link href="#pricing" className="text-muted hover:text-fg transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="text-muted hover:text-fg transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
