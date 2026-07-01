/**
 * Simple in-memory sliding-window rate limiter.
 * Not shared across serverless instances — good enough for single-process / dev,
 * and prevents accidental self-DoS against upstream sources.
 */

const hits = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  windowMs: number = 60_000,
  maxHits: number = 10
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxHits) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}
