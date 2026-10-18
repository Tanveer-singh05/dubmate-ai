"use client";

import { useEffect, useState } from "react";

export type RuntimeMode = "local" | "cloud" | "unknown";

export type RuntimeFeatures = {
  show_credits: boolean;
  show_billing: boolean;
  show_api_keys: boolean;
  local_free_dubbing: boolean;
};

type RuntimeResponse = {
  mode: "local" | "cloud";
  features: RuntimeFeatures;
};

let cached: RuntimeResponse | null = null;
let inflight: Promise<RuntimeResponse | null> | null = null;

async function fetchRuntimeMode(): Promise<RuntimeResponse | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/system/runtime-mode", {
        cache: "no-store",
      });
      if (!res.ok) return null;
      cached = (await res.json()) as RuntimeResponse;
      return cached;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useRuntimeMode() {
  const [mode, setMode] = useState<RuntimeMode>("unknown");
  const [features, setFeatures] = useState<RuntimeFeatures | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchRuntimeMode().then((r) => {
      if (!mounted || !r) return;
      setMode(r.mode);
      setFeatures(r.features);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { mode, features };
}

export type HardwareInfo = {
  gpu_name?: string;
  gpu_vram_mb?: number;
  recommended_max_video_seconds?: number;
  recommended_quality?: string;
  tier?: "low_vram" | string;
};

export function useHardwareInfo() {
  const [hw, setHw] = useState<HardwareInfo | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch("http://127.0.0.1:8000/system/hardware", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted) setHw((d as HardwareInfo) ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return hw;
}