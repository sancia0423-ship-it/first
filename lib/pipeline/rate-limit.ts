/**
 * Simple in-memory sliding-window rate limiter.
 * Not shared across serverless instances — good enough for single-process / dev,
 * and prevents accidental self-DoS against upstream sources.
 */

import { RATE_LIMIT_MAX_HITS, RATE_LIMIT_WINDOW_MS } from "@/lib/config";

const hits = new Map<string, number[]>();

/** Keys are attacker-controlled (client IPs), so the map needs a ceiling. */
const MAX_TRACKED_KEYS = 5_000;

function prune(now: number, windowMs: number) {
  for (const [key, timestamps] of hits) {
    if (timestamps.length === 0 || timestamps[timestamps.length - 1] <= now - windowMs) {
      hits.delete(key);
    }
  }
}

export function isRateLimited(
  key: string,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
  maxHits: number = RATE_LIMIT_MAX_HITS
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxHits) {
    hits.set(key, timestamps);
    return true;
  }

  if (!hits.has(key) && hits.size >= MAX_TRACKED_KEYS) {
    prune(now, windowMs);
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}

/**
 * Best-effort client identity. `x-forwarded-for` is spoofable unless the app sits
 * behind a proxy that overwrites it — this limiter is an abuse speed bump, not
 * an authorization boundary.
 */
export function getClientKey(request: { headers: Headers }) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}
