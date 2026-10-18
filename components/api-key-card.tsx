"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, Star, StarOff, Lock, Unlock, Eye, EyeOff,
  RefreshCw, Trash2, Loader2, ExternalLink,
} from "lucide-react";
import { api, ApiError, APIKeyOut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export const PROVIDER_META: Record<
  string,
  { label: string; keyUrl: string; keyUrlLabel: string; steps: string[]; note?: string }
> = {
  gemini: {
    label: "Google Gemini",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyUrlLabel: "aistudio.google.com",
    steps: [
      "Sign in with your Google account",
      "Click “Create API key”",
      "Copy the key (starts with AIza…)",
    ],
  },
  groq: {
    label: "Groq",
    keyUrl: "https://console.groq.com/keys",
    keyUrlLabel: "console.groq.com",
    steps: [
      "Sign in / sign up (free tier)",
      "Click “Create API Key”",
      "Copy the key (starts with gsk_…)",
    ],
    note: "Groq shows the key only once — paste it immediately.",
  },
  openrouter: {
    label: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    keyUrlLabel: "openrouter.ai",
    steps: [
      "Sign in / sign up",
      "Click “Create Key”",
      "Copy the key (starts with sk-or-…)",
    ],
  },
};

function providerMeta(provider: string) {
  return PROVIDER_META[provider] || {
    label: provider, keyUrl: "", keyUrlLabel: "", steps: [],
  };
}

export function ProviderGuide({ provider }: { provider: string }) {
  const meta = providerMeta(provider);
  if (!meta.keyUrl && meta.steps.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 text-xs space-y-2">
      <p className="font-medium">
        Get a {meta.label} key from{" "}
        <a href={meta.keyUrl} target="_blank" rel="noopener noreferrer"
           className="text-primary underline inline-flex items-center gap-1">
          {meta.keyUrlLabel}<ExternalLink size={11} />
        </a>
      </p>
      {meta.steps.length > 0 && (
        <ol className="list-decimal list-inside text-muted space-y-0.5">
          {meta.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
      {meta.note && (
        <p className="text-[10px] text-amber-500 leading-tight">{meta.note}</p>
      )}
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export function APIKeyCard({ apiKey }: { apiKey: APIKeyOut }) {
  const qc = useQueryClient();
  const [detailOpen, setDetailOpen] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);

  const meta = providerMeta(apiKey.provider);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["keys"] });

  const toggleDefault = useMutation({
    mutationFn: () => api.updateKey(apiKey.id, { is_default: !apiKey.is_default }),
    onSuccess: () => { invalidate(); toast(apiKey.is_default ? "Removed default" : "Set as default", "success"); },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });
  const toggleLock = useMutation({
    mutationFn: () => api.updateKey(apiKey.id, { is_locked: !apiKey.is_locked }),
    onSuccess: () => { invalidate(); toast(apiKey.is_locked ? "Unlocked" : "Locked", "success"); },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });
  const revalidate = useMutation({
    mutationFn: () => api.validateKey(apiKey.id),
    onSuccess: (data) => {
      invalidate();
      toast(
        data.last_validation_ok ? "Key valid"
          : `Invalid: ${data.last_validation_error || "unknown reason"}`,
        data.last_validation_ok ? "success" : "error"
      );
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });
  const remove = useMutation({
    mutationFn: () => api.deleteKey(apiKey.id),
    onSuccess: () => { invalidate(); toast("Key deleted", "success"); setDetailOpen(false); },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed", "error"),
  });

  const handleReveal = async () => {
    if (revealed) { setRevealed(null); return; }
    setRevealLoading(true);
    try {
      const r = await api.revealKey(apiKey.id);
      setRevealed(r.plaintext);
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : "Failed to reveal";
      toast(message, "error");
    } finally { setRevealLoading(false); }
  };

  const closeDetail = () => { setDetailOpen(false); setRevealed(null); };

  return (
    <>
      <button onClick={() => setDetailOpen(true)}
        className={cn(
          "w-full text-left rounded-xl border bg-card p-4 transition",
          "hover:border-primary/40 hover:bg-card/80",
          apiKey.is_locked ? "border-yellow-500/30 opacity-70" : "border-border"
        )}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <KeyRound size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{apiKey.label}</p>
              {apiKey.is_default && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">DEFAULT</span>
              )}
              {apiKey.is_locked && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-500 font-medium">LOCKED</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted mt-0.5 flex-wrap">
              <span className="uppercase">{apiKey.provider}</span>
              <span className="font-mono">{apiKey.masked_key}</span>
              <span className={apiKey.last_validation_ok ? "text-emerald-500" : "text-red-500"}>
                {apiKey.last_validation_ok ? "✓ valid" : "✗ invalid"}
              </span>
              <span>{apiKey.usage_count} use{apiKey.usage_count === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      </button>

      <Dialog open={detailOpen} onClose={closeDetail}>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <KeyRound size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">{apiKey.label}</h2>
              <p className="text-xs text-muted">{meta.label}</p>
            </div>
          </div>

          {apiKey.is_locked && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-3 text-xs">
              <p className="font-medium text-yellow-500 mb-1">This key is locked</p>
              <p className="text-muted">
                Locked keys are excluded from the dubbing pipeline. Click <strong>Unlock</strong> below to re-enable.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">API Key</p>
              <button onClick={handleReveal} disabled={revealLoading}
                className="text-xs flex items-center gap-1 text-primary hover:underline disabled:opacity-50">
                {revealLoading ? <Loader2 size={12} className="animate-spin" />
                  : revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                {revealed ? "Hide" : "Reveal"}
              </button>
            </div>
            <p className="font-mono text-xs break-all">{revealed || apiKey.masked_key}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted mb-0.5">Status</p>
              <p className={apiKey.last_validation_ok ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                {apiKey.last_validation_ok ? "Valid" : "Invalid"}
              </p>
              {!apiKey.last_validation_ok && apiKey.last_validation_error && (
                <p className="text-muted text-[10px] mt-0.5 break-all">{apiKey.last_validation_error}</p>
              )}
            </div>
            <div>
              <p className="text-muted mb-0.5">Uses</p>
              <p className="font-medium">{apiKey.usage_count}</p>
            </div>
            <div>
              <p className="text-muted mb-0.5">Created</p>
              <p className="font-medium">{formatDate(apiKey.created_at)}</p>
            </div>
            <div>
              <p className="text-muted mb-0.5">Last used</p>
              <p className="font-medium">{formatDate(apiKey.last_used_at)}</p>
            </div>
          </div>

          <div className="pt-1">
            <p className="text-xs font-medium mb-2">How to get a new key</p>
            <ProviderGuide provider={apiKey.provider} />
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" onClick={() => toggleDefault.mutate()}
              disabled={toggleDefault.isPending} className="gap-1">
              {apiKey.is_default ? <StarOff size={14} /> : <Star size={14} />}
              {apiKey.is_default ? "Unset default" : "Set default"}
            </Button>
            <Button size="sm" variant={apiKey.is_locked ? "default" : "outline"}
              onClick={() => toggleLock.mutate()} disabled={toggleLock.isPending} className="gap-1">
              {apiKey.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
              {apiKey.is_locked ? "Unlock" : "Lock"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => revalidate.mutate()}
              disabled={revalidate.isPending} className="gap-1">
              {revalidate.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Revalidate
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => { if (confirm(`Delete key "${apiKey.label}"?`)) remove.mutate(); }}
              disabled={remove.isPending}
              className="gap-1 text-red-500 hover:text-red-500">
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}