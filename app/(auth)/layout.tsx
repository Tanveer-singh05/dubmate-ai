import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Minimal top bar with just the logo */}
      <header className="flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/favicon.ico" alt="" className="w-7 h-7 rounded-lg" />
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
