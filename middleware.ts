import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/keys", "/studio", "/jobs"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------------------------------------------------------------
  // Geo-based currency detection
  // Vercel injects x-vercel-ip-country on every request. In local dev
  // it's absent — we fall back to INR so you can test the home market.
  // ---------------------------------------------------------------
  const country =
    request.geo?.country ||
    request.headers.get("x-vercel-ip-country") ||
    "";
  const currency = country === "IN" ? "INR" : country ? "USD" : "INR";


  // Only run on protected routes
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    const res = NextResponse.next();
    res.cookies.set("currency", currency, { path: "/", maxAge: 604800 });
    return res;
  }

  // Auth store uses localStorage, so we check via cookie fallback
  // For simplicity: allow through (client-side layout will redirect)
  const res = NextResponse.next();
  res.cookies.set("currency", currency, { path: "/", maxAge: 604800 });
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/keys/:path*", "/studio/:path*", "/billing/:path*", "/jobs/:path*"],
};