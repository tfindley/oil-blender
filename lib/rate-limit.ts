// In-process token-bucket rate limiter. Per-instance — fine for the current
// single-container deploy. Swap for @upstash/ratelimit if we ever scale to
// multiple replicas (the in-memory map doesn't share across processes).
//
// Trust note: callers derive the rate-limit key from `x-forwarded-for`. That
// header is only trustworthy when the app sits behind a reverse proxy that
// overwrites it with the real client IP (nginx / Cloudflare / etc.). Direct
// public exposure of the Next.js port would let attackers spoof their key.

type Bucket = { tokens: number; last: number }

const buckets = new Map<string, Bucket>()
const STALE_MS = 60 * 60_000

export function rateLimit(
  key: string,
  max = 10,
  windowMs = 60_000,
): { ok: boolean; retryAfter?: number } {
  const now = Date.now()

  if (buckets.size > 1000) {
    for (const [k, v] of buckets) if (now - v.last > STALE_MS) buckets.delete(k)
  }

  const b = buckets.get(key) ?? { tokens: max, last: now }
  const refill = ((now - b.last) / windowMs) * max
  b.tokens = Math.min(max, b.tokens + refill)
  b.last = now

  if (b.tokens < 1) {
    buckets.set(key, b)
    const retryAfter = Math.ceil((1 - b.tokens) * (windowMs / max) / 1000)
    return { ok: false, retryAfter }
  }

  b.tokens -= 1
  buckets.set(key, b)
  return { ok: true }
}
