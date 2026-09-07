import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

// Without this, every unique key (email/IP) ever seen stays in the map
// forever — an unbounded memory leak on a long-running process. Sweep
// expired buckets periodically instead of only ever adding to the map.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of memoryBuckets) {
      if (now > bucket.resetAt) memoryBuckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS).unref?.();
}

function checkRateLimitMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count++;
  return true;
}

async function checkRateLimitRedis(key: string, limit: number, windowMs: number): Promise<boolean> {
  // Fixed-window counter via INCR + EXPIRE, mirroring the in-memory
  // implementation's exact semantics so callers see identical behavior
  // regardless of which backend is active.
  const redisKey = `ratelimit:${key}`;
  const count = await redis!.incr(redisKey);
  if (count === 1) {
    await redis!.pexpire(redisKey, windowMs);
  }
  return count <= limit;
}

/**
 * Rate limiter with two backends: **Upstash Redis** (when
 * `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set) — a real
 * shared store that works correctly across multiple server instances and
 * serverless deployments — or an **in-memory fallback** otherwise, which
 * only works correctly on a single long-running process (fine for local
 * dev, NOT safe on serverless platforms like Vercel where each request can
 * hit a different instance with its own empty memory). Same nullable-client
 * pattern as `src/lib/email.ts`.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (redis) return checkRateLimitRedis(key, limit, windowMs);
  return checkRateLimitMemory(key, limit, windowMs);
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
