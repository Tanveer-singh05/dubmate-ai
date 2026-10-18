"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorMsg("Enter the 6-digit code from your email.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.verifyEmail({ email, otp });
      useAuthStore.setState({ token: res.access_token });
      const user = await api.me();
      setAuth(res.access_token, user);
      toast(`Welcome, ${user.name}!`, "success");
      router.push("/dashboard");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Verification failed. Try again.";
      setErrorMsg(msg);
      setOtp("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMsg(null);
    try {
      await api.resendOtp({ email });
      toast("New code sent. Check your inbox.", "success");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Could not resend. Try again.";
      setErrorMsg(msg);
      // If the backend sent a cooldown response, honour the wait.
      const m = /wait (\d+)s/.exec(msg);
      if (m) setCooldown(parseInt(m[1], 10));
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted">
          Missing email. Please register or sign in again.
        </p>
        <Link
          href="/login"
          className="text-primary hover:underline text-sm"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
    >
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="text-primary" size={22} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-muted mt-1.5">
          We sent a 6-digit code to <br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            ref={inputRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            className="text-center text-2xl tracking-[0.5em] font-mono"
          />
          {errorMsg && (
            <p className="text-xs text-destructive mt-1.5">{errorMsg}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || otp.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Verifying...
            </>
          ) : (
            "Verify and continue"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        Didn&apos;t get the code?{" "}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="text-primary hover:underline font-medium disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend"}
          </button>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary"
        >
          <ArrowLeft size={12} /> Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}
