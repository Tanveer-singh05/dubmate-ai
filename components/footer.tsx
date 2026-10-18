import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles size={14} className="text-primary-fg" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-sm tracking-tight">DubMate AI</span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Professional AI dubbing with voice cloning, emotion awareness, and lip-sync.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fg mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#features" className="text-muted hover:text-fg transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-muted hover:text-fg transition-colors">Pricing</Link></li>
              <li><Link href="/studio" className="text-muted hover:text-fg transition-colors">Studio</Link></li>
              <li><Link href="/register" className="text-muted hover:text-fg transition-colors">Sign up</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fg mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-muted hover:text-fg transition-colors">About</Link></li>
              <li><Link href="#" className="text-muted hover:text-fg transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-muted hover:text-fg transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-muted hover:text-fg transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fg mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="text-muted hover:text-fg transition-colors">Privacy</Link></li>
              <li><Link href="#" className="text-muted hover:text-fg transition-colors">Terms</Link></li>
              <li><Link href="#" className="text-muted hover:text-fg transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {year} DubMate AI. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Built for creators, in every language.
          </p>
        </div>
      </div>
    </footer>
  );
}