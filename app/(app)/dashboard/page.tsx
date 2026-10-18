"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Film, KeyRound, ArrowRight, Plus, Loader2, Download, Play,
  CheckCircle2, XCircle, Coins, TrendingUp, Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/auth-store";
import { useRuntimeMode } from "@/lib/runtime-mode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Job = {
  id: string;
  status: string;
  has_lip_sync?: boolean;
  video_filename: string;
  source_language: string;
  target_language: string;
  output_video_url: string;
  error: string;
  created_at: string | null;
  completed_at: string | null;
};

function publicUrl(pathOrUrl: string): string {
  const s = String(pathOrUrl || "").replace(/\\/g, "/");
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/outputs/")) return `${API_URL}${s}`;
  if (s.startsWith("outputs/")) return `${API_URL}/${s}`;
  const base = s.split("/").pop() || s;
  return `${API_URL}/outputs/${base}`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  } catch { return iso; }
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function StatusPill({ job }: { job: Job }) {
  if (job.status === "done" && job.has_lip_sync) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-medium">
        <CheckCircle2 size={10} /> lip-synced
      </span>
    );
  }
  if (job.status === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500 font-medium">
        dubbed
      </span>
    );
  }
  if (job.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 font-medium">
        <XCircle size={10} /> failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-500 font-medium">
      <Loader2 size={10} className="animate-spin" /> running
    </span>
  );
}

function JobRow({ job }: { job: Job }) {
  const dl = job.output_video_url ? publicUrl(job.output_video_url) : "";
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Film size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{job.video_filename || "Untitled"}</p>
          <StatusPill job={job} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5 flex-wrap">
          <span>{job.source_language} → {job.target_language}</span>
          <span>{formatRelative(job.created_at)}</span>
          {job.status === "failed" && job.error && (
            <span className="text-red-500 truncate max-w-[240px]">{job.error.slice(0, 120)}</span>
          )}
        </div>
      </div>
      {job.status === "done" && dl && (
        <div className="flex items-center gap-1 shrink-0">
          <a href={dl} target="_blank" rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 text-muted hover:text-primary px-2 py-1 rounded hover:bg-accent/10">
            <Play size={12} /> Play
          </a>
          <a href={dl} download
            className="text-xs flex items-center gap-1 text-primary hover:underline px-2 py-1">
            <Download size={12} /> Download
          </a>
        </div>
      )}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

function StatCard({
  label, value, sub, icon: Icon, accent = "primary",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: "primary" | "emerald" | "blue" | "amber";
}) {
  const accentClasses = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10",
  }[accent];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-xs text-muted font-medium">{label}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accentClasses}`}>
            <Icon size={14} />
          </div>
        </div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ActivitySparkline({ jobs }: { jobs: Job[] }) {
  // Bucket jobs by day for the last 7 days
  const buckets = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return {
        date: d,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0,
      };
    });

    for (const j of jobs) {
      if (!j.created_at) continue;
      const jt = new Date(j.created_at);
      jt.setHours(0, 0, 0, 0);
      const idx = days.findIndex((d) => d.date.getTime() === jt.getTime());
      if (idx >= 0) days[idx].count += 1;
    }
    return days;
  }, [jobs]);

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Activity
            </CardTitle>
            <CardDescription>{total} dubs this week</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-24">
          {buckets.map((b, i) => {
            const pct = (b.count / max) * 100;
            const height = b.count === 0 ? 4 : Math.max(8, pct);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end justify-center h-20">
                  <div
                    className={`w-full rounded-t transition-all ${
                      b.count === 0 ? "bg-muted/20" : "bg-primary/70"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${b.count} on ${b.label}`}
                  />
                </div>
                <span className="text-[10px] text-muted">{b.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [jobsOpen, setJobsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { features } = useRuntimeMode();
  const isLocal = features ? !features.show_credits : false;
  const { data: keys, isLoading: keysLoading } = useQuery({
    queryKey: ["keys"],
    queryFn: api.listKeys,
  });
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", 7],
    queryFn: () => api.listJobs(7),
    refetchOnMount: "always",
    staleTime: 0,
  });
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["billing", "balance"],
    queryFn: () => api.getBalance(),
  });

  const totalKeys = keys?.length ?? 0;
  const activeKeys = keys?.filter((k) => !k.is_locked).length ?? 0;

  const jobsList =
    jobsData && typeof jobsData === "object" && "jobs" in jobsData
      ? (jobsData as { jobs?: Job[] }).jobs ?? []
      : [];
  const allJobs: Job[] = Array.isArray(jobsList) ? jobsList : [];
  const lipSyncedJobs = allJobs.filter((j) => j.status === "done" && j.has_lip_sync);
  const lipSyncedCount = lipSyncedJobs.length;
  const failedCount = allJobs.filter((j) => j.status === "failed").length;
  const doneCount = allJobs.filter((j) => j.status === "done").length;
  const days = jobsData?.days ?? 7;

  // Success rate = done / (done + failed) among finished jobs
  const finished = doneCount + failedCount;
  const successRate = finished > 0 ? Math.round((doneCount / finished) * 100) : null;

  const balance = balanceData?.balance ?? null;
  const balanceMinutes = balanceData?.balance_minutes ?? null;

  // Setup checklist state
  const hasKeys = totalKeys > 0;
  const hasDubs = allJobs.length > 0;
  const hasVerified = true; // email verification is implied: if you're here, you're verified
  const checklistDone = hasKeys && hasDubs;
  const checklistSteps = [
    { done: hasVerified, label: "Verify your email", sub: "Already done", href: null },
    { done: hasKeys, label: "Add an API key", sub: "Gemini, Groq, or OpenRouter", href: "/keys" },
    { 
      done: hasDubs, 
      label: "Create your first dub", 
      sub: isLocal ? "Upload a video in Studio" : "Upload a video in Studio", 
      href: "/studio" 
    },
  ];
  const completedSteps = checklistSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {/* 1. Welcome header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-muted">Here&apos;s what&apos;s happening with your dubs</p>
        </div>
        <Link href="/studio">
          <Button className="gap-2">
            <Plus size={16} /> New Dub
          </Button>
        </Link>
      </div>

      {/* 2 & 3. Credits + Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!isLocal && (
        <Card className="col-span-2 lg:col-span-1 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-xs text-muted font-medium">Credits</p>
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Coins size={14} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold leading-tight">
              {balanceLoading ? <Loader2 className="animate-spin" size={20} /> : (balance ?? "—")}
            </p>
            <div className="flex items-center justify-between mt-1 gap-2">
              {balanceMinutes !== null ? (
                <p className="text-[11px] text-muted">
                  {formatMinutes(Math.floor(balanceMinutes))} cloud
                </p>
              ) : (
                <span />
              )}
              <Link
                href="/billing"
                className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Top up <ArrowRight size={10} />
              </Link>
            </div>
          </CardContent>
        </Card>
        )}
        <StatCard
          label="API Keys"
          value={keysLoading ? "—" : totalKeys}
          sub={`${activeKeys} active · ${totalKeys - activeKeys} locked`}
          icon={KeyRound}
          accent="primary"
        />

        <StatCard
          label="Lip-Synced Dubs"
          value={jobsLoading ? "—" : lipSyncedCount}
          sub={
            failedCount > 0
              ? `last ${days} days · ${failedCount} failed`
              : `last ${days} days`
          }
          icon={Film}
          accent="emerald"
        />

        <StatCard
          label="Success Rate"
          value={successRate === null ? "—" : `${successRate}%`}
          sub={finished > 0 ? `${doneCount} of ${finished} finished` : "No finished jobs yet"}
          icon={Zap}
          accent="blue"
        />
      </div>

      {/* 4 & 6. Checklist + Activity */}
      <div className="grid md:grid-cols-3 gap-4">
        {!checklistDone && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Get Started</CardTitle>
              <CardDescription>
                {completedSteps} of {checklistSteps.length} steps complete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklistSteps.map((step, i) => {
                const row = (
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                      step.done
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        step.done ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {step.done ? <CheckCircle2 size={14} /> : <span className="text-xs font-semibold">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.done ? "text-muted line-through" : ""}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted">{step.sub}</p>
                    </div>
                    {!step.done && step.href && <ArrowRight size={16} className="text-muted shrink-0" />}
                  </div>
                );
                return step.href && !step.done ? (
                  <Link key={i} href={step.href} className="block">{row}</Link>
                ) : (
                  <div key={i}>{row}</div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className={checklistDone ? "md:col-span-3" : "md:col-span-1"}>
          <ActivitySparkline jobs={allJobs} />
        </div>
      </div>

      {/* 5. Recent dubs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Dubs</CardTitle>
              <CardDescription>
                {lipSyncedJobs.length === 0
                  ? `No dubs in the past ${days} days`
                  : `${Math.min(5, allJobs.length)} of ${allJobs.length} in the past ${days} days`}
              </CardDescription>
            </div>
            <button
              onClick={() => setJobsOpen(true)}
              className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : allJobs.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              <Film size={32} className="mx-auto mb-2 opacity-40" />
              <p>No dubs yet</p>
              <Link href="/studio">
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <Plus size={14} /> Start your first dub
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {allJobs.slice(0, 5).map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All dubs dialog */}
      <Dialog open={jobsOpen} onClose={() => setJobsOpen(false)}>
        <div className="p-6 space-y-4">
          <div className="pr-8">
            <h2 className="font-semibold text-lg">All Dubs</h2>
            <p className="text-xs text-muted mt-0.5">
              {lipSyncedCount} lip-synced · last {days} days
              {failedCount > 0 && ` · ${failedCount} failed`}
            </p>
          </div>

          {allJobs.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              <Film size={36} className="mx-auto mb-2 opacity-40" />
              <p>No dubs yet</p>
              <Link href="/studio" onClick={() => setJobsOpen(false)}>
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  <Plus size={14} /> Start your first dub
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {allJobs.map((j) => <JobRow key={j.id} job={j} />)}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
