"use client";

import * as React from "react";
import { create } from "zustand";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
};

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastType = "info") {
  useToast.getState().push(message, type);
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg animate-slide-up backdrop-blur-lg",
            t.type === "success" &&
              "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-800",
            t.type === "error" &&
              "bg-red-50 border-red-200 dark:bg-red-950/80 dark:border-red-800",
            t.type === "info" && "bg-card border-border"
          )}
        >
          <p className="text-sm flex-1">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}