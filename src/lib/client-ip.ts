import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting.
 *
 * `x-forwarded-for` is only trustworthy when the app sits behind a proxy that
 * overwrites it (Vercel, Fly, nginx with `proxy_set_header`). The first entry is
 * the original client. When no header is present (local dev), all requests share
 * a single bucket.
 */
export async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  const ip = first || headerStore.get("x-real-ip")?.trim() || "local";
  return ip.slice(0, 64);
}
