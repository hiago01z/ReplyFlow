/**
 * Rate limiting via Upstash Redis (sliding window).
 * Falls back to a no-op (allow all) when env vars are missing,
 * so the app keeps working without Redis in development.
 *
 * Env vars needed:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

let _redis: import("@upstash/redis").Redis | null = null;

function getRedis() {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  _redis = new Redis({ url, token });
  return _redis;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** How many requests remaining in the window */
  remaining: number;
  /** Unix ms timestamp when the window resets */
  reset: number;
}

/**
 * Sliding-window rate limiter.
 * @param key     Unique key, e.g. `rl:generate:user_<id>`
 * @param limit   Max requests per window
 * @param windowS Window size in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowS: number
): Promise<RateLimitResult> {
  const redis = getRedis();

  // No Redis → allow all (dev mode / missing env)
  if (!redis) {
    return { success: true, remaining: limit - 1, reset: Date.now() + windowS * 1000 };
  }

  const now = Date.now();
  const windowMs = windowS * 1000;
  const windowStart = now - windowMs;

  // Use a sorted set: score = timestamp, member = `${timestamp}-${random}`
  const member = `${now}-${Math.random()}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);          // remove old entries
  pipeline.zadd(key, { score: now, member });              // add current request
  pipeline.zcard(key);                                     // count in window
  pipeline.pexpire(key, windowMs);                         // auto-expire key

  const results = await pipeline.exec();
  const count = (results[2] as number) ?? 1;

  const remaining = Math.max(0, limit - count);
  const reset     = now + windowMs;

  return {
    success:   count <= limit,
    remaining,
    reset,
  };
}
