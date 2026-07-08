import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
      );
    }
    redis = Redis.fromEnv();
  }

  return redis;
}

// Built lazily so importing this module doesn't crash routes before Upstash env vars are set.
export function makeLimiter(prefix: string, requests: number, window: `${number} ${"s" | "m"}`) {
  let limiter: Ratelimit | null = null;
  return {
    limit: (key: string) => {
      if (!limiter) {
        limiter = new Ratelimit({
          redis: getRedis(),
          prefix: `ratelimit:${prefix}`,
          limiter: Ratelimit.slidingWindow(requests, window),
        });
      }
      return limiter.limit(key);
    },
  };
}

export function getRequestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Fails open (allows the request) if Upstash is unreachable/misconfigured — a rate-limiter
// outage shouldn't take down login/register/contact.
export async function isRateLimited(limiter: ReturnType<typeof makeLimiter>, key: string) {
  try {
    const { success } = await limiter.limit(key);
    return !success;
  } catch (error) {
    console.error("Rate limit check failed, allowing request:", error);
    return false;
  }
}
