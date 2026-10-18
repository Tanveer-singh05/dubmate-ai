import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Minimal top bar with just the logo */}
      <header className="flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30 group-hover:shadow-md group-hover:shadow-primary/40 transition-all">
            <Sparkles size={14} className="text-primary-fg" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-tight">DubMate AI</span>
        </Link>
        <Link
          href="/"
          className="text-xs text-muted hover:text-fg transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* Centered card content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}