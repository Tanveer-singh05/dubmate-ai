"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Check, Loader2, Sparkles, Clock, HardDrive, AlertCircle, CreditCard } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { useRuntimeMode } from "@/lib/runtime-mode";

type Currency = "USD" | "INR";

type Pack = {
  pack_id: string;
  name: string;
  currency: string;
  symbol: string;
  price_small: number;
  price_major: number;
  price_display: string;
  credits: number;
  cloud_minutes: number;
  storage_gb: number;
  retention_days: number;
};


function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return iso; }
}

function OrderPill({ status }: { status: string }) {
  const m: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-500",
    created: "bg-yellow-500/15 text-yellow-500",
    failed: "bg-red-500/15 text-red-500",
    expired: "bg-muted/40 text-muted",
  };
  return (
    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded font-medium ${m[status] || m.expired}`}>
      {status === "created" ? "pending" : status}
    </span>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { features } = useRuntimeMode();
  useEffect(() => {
    if (features && !features.show_billing) router.replace("/dashboard");
  }, [features, router]);
  const [currency, setCurrency] = useState<Currency>("INR");
  const [buying, setBuying] = useState<string | null>(null);
  const buyingRef = useRef(false);

  // Currency is set by middleware.ts based on the user's country
  // (x-vercel-ip-country). Read it from the cookie on mount.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const m = document.cookie.match(/(?:^|; )currency=([^;]+)/);
    const c = m?.[1];
    if (c === "USD" || c === "INR") setCurrency(c);
  }, []);
  
  const packsQ = useQuery({
    queryKey: ["billing", "packs", currency],
    queryFn: () => api.getPacks(currency),
    staleTime: 300000,
  });
  const balQ = useQuery({ queryKey: ["billing", "balance"], queryFn: () => api.getBalance() });
  const ordersQ = useQuery({ queryKey: ["billing", "orders"], queryFn: () => api.getOrders() });

  useEffect(() => {
    if (params.get("purchase") === "success") {
      const already = params.get("already_paid");
      toast(
        already === "1" ? "Purchase already completed." : "Purchase complete! Credits added.",
        already === "1" ? "info" : "success"
      );
      qc.invalidateQueries({ queryKey: ["billing", "balance"] });
      qc.invalidateQueries({ queryKey: ["billing", "orders"] });
      router.replace("/billing");
    }
  }, [params, qc, router]);

  const onBuy = async (p: Pack) => {
    // Synchronous guard: blocks double-clicks that fire before React
    // re-renders with the disabled state.
    if (buyingRef.current) return;
    buyingRef.current = true;
    setBuying(p.pack_id);
    try {
      const res = await api.startCheckout({ pack_id: p.pack_id, currency });
      window.location.href = res.checkout_url;
      // No need to reset — the page is about to unload.
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Checkout failed", "error");
      buyingRef.current = false;
      setBuying(null);
    }
  };

  const balance = balQ.data?.balance ?? null;
  const packs = packsQ.data?.packs ?? [];
  const freeTier = packsQ.data?.free_tier ?? null;
  const orders = ordersQ.data?.orders ?? [];
  if (features && !features.show_billing) {
    return <div className="p-8 text-sm text-muted">Billing is disabled in local mode.</div>;
  }
  
  return (
    <div className="space-y-8">
      {/* Header + currency toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Credits</h1>
          <p className="text-muted">Buy credits to run cloud dubs. Local dubbing is always free.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Card className="min-w-[200px]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Coins className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted">Your balance</p>
                  {balQ.isLoading ? <Loader2 className="animate-spin mt-1" size={16} /> : (
                    <p className="text-2xl font-bold">{balance ?? "—"}</p>
                  )}
                  {balance !== null && (
                    <p className="text-[11px] text-muted">{formatMinutes(balance / 2)} of cloud time</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {freeTier && (
        <div className="rounded-lg border border-border bg-card/50 p-4 flex items-start gap-3">
          <Sparkles className="text-primary shrink-0 mt-0.5" size={16} />
          <div className="text-sm">
            <p className="font-medium">You got {freeTier.credits} free credits on signup</p>
            <p className="text-muted text-xs mt-0.5">
              {formatMinutes(freeTier.cloud_minutes)} of cloud processing • {freeTier.storage_gb} GB storage • {freeTier.retention_days}-day retention
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Buy credits</h2>
        {packsQ.isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : packsQ.isError ? (
          <Card><CardContent className="p-6 flex items-center gap-3 text-destructive"><AlertCircle size={18} /><p>Could not load packs.</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packs.map((p) => (
              <Card key={p.pack_id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-fg block mt-2">{p.price_display}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Coins size={14} className="text-primary" /><span className="font-medium">{p.credits} credits</span></div>
                    <div className="flex items-center gap-2 text-muted"><Clock size={14} /><span>{formatMinutes(p.cloud_minutes)} of cloud time</span></div>
                    <div className="flex items-center gap-2 text-muted"><HardDrive size={14} /><span>{p.storage_gb} GB storage</span></div>
                    <div className="flex items-center gap-2 text-muted"><Check size={14} /><span>{p.retention_days}-day retention</span></div>
                  </div>
                  <div className="mt-auto pt-2">
                    <Button className="w-full" onClick={() => onBuy(p)} disabled={buying === p.pack_id}>
                      {buying === p.pack_id ? <><Loader2 className="animate-spin" size={14} /> Redirecting...</> : <>Buy {p.name}</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Purchase history</h2>
        <Card>
          {ordersQ.isLoading ? (
            <CardContent className="p-6 flex justify-center"><Loader2 className="animate-spin text-primary" size={20} /></CardContent>
          ) : orders.length === 0 ? (
            <CardContent className="p-8 text-center">
              <CreditCard className="mx-auto text-muted mb-3" size={28} />
              <p className="text-sm text-muted">No purchases yet.</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((o) => (
                <div key={o.order_id} className="p-4 flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Coins className="text-primary" size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{o.pack_id.charAt(0).toUpperCase() + o.pack_id.slice(1)} pack · {o.credits} credits</p>
                      <p className="text-xs text-muted">{formatRelative(o.paid_at || o.created_at)} · {o.amount_display}</p>
                    </div>
                  </div>
                  <div className="shrink-0"><OrderPill status={o.status} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
