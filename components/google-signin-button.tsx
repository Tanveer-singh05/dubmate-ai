"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/components/ui/toast";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
            use_fedcm_for_button?: boolean;
          }) => void;
          cancel: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  text = "continue_with",
}: {
  text?: "continue_with" | "signin_with" | "signup_with";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const callbackRef = useRef<((response: { credential: string }) => void) | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Stable callback — never changes identity across renders,
  // so GSI always calls the SAME function even if init happens twice.
  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await api.googleAuth(response.credential);
        useAuthStore.setState({ token: res.access_token });
        const user = await api.me();
        setAuth(res.access_token, user);
        toast(`Welcome, ${user.name}!`, "success");
        router.push("/dashboard");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[google-signin] callback error:", e);
        const msg =
          e instanceof ApiError ? e.message : "Google sign-in failed";
        toast(msg, "error");
      }
    },
    [router, setAuth]
  );

  // Keep a ref to the latest callback so the initialized instance always
  // invokes the current closure.
  useEffect(() => {
    callbackRef.current = handleCredential;
  }, [handleCredential]);

  useEffect(() => {
    if (!scriptLoaded) return;
    if (!containerRef.current) return;
    if (!CLIENT_ID) return;
    if (!window.google?.accounts?.id) return;

    const width = containerRef.current.offsetWidth || 360;

    // Only initialize ONCE per component lifetime, even under StrictMode.
    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          // Delegate to the ref so we always call the latest closure.
          callbackRef.current?.(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        // Route both One Tap and the button through FedCM. This stops the
        // legacy account-chooser card ("Sign in as <name> <email>") from
        // appearing on page load when the browser has a Google session.
        use_fedcm_for_prompt: true,
        use_fedcm_for_button: true,
      });
      initializedRef.current = true;
    }

    // Belt-and-braces: if a One Tap prompt was queued before we knew about it,
    // cancel it. Safe to call even when nothing is pending.
    try {
      window.google.accounts.id.cancel();
    } catch {
      /* older GSI builds may not expose cancel() — ignore */
    }

    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });
  }, [scriptLoaded, text]);

  if (!CLIENT_ID) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-3 text-xs text-muted text-center">
        Google sign-in is not configured.
        <br />
        Set{" "}
        <code className="text-foreground">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
        in <code className="text-foreground">.env.local</code>.
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ minHeight: 40 }}>
      {/* Real GSI button — rendered but visually hidden under the overlay.
          GSI "large" size is 40px tall, so we size the container to match. */}
      <div
        ref={containerRef}
        className="w-full flex justify-center opacity-0"
        style={{ minHeight: 40 }}
      />

      {/* Our button — clicks pass through to the GSI layer below. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    </div>
  );
}