import type { RouteContext } from "emdash";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const RETRY_AFTER_SECONDS = 60;

type RateLimitState = {
  hits: number[];
};

type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

const rateLimitKey = (route: string, ip: string): string =>
  `rate-limit:${route}:${encodeURIComponent(ip)}`;

const clientIp = (ctx: RouteContext): string =>
  ctx.requestMeta.ip ??
  ctx.request.headers.get("cf-connecting-ip") ??
  ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

const storedHits = (state: RateLimitState | null, windowStart: number): number[] =>
  state?.hits.filter((hit) => Number.isSafeInteger(hit) && hit > windowStart) ?? [];

/**
 * Subrequest audit for /submit: 1 KV read + 1 KV write on accepted requests,
 * 1 KV read on throttled requests. Added subrequests per invocation: ≤ 2.
 */
export const enforceRateLimit = async (
  ctx: RouteContext,
  route: string,
): Promise<RateLimitResult> => {
  const now = Date.now();
  const key = rateLimitKey(route, clientIp(ctx));
  const hits = storedHits(await ctx.kv.get<RateLimitState>(key), now - WINDOW_MS);
  if (hits.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: RETRY_AFTER_SECONDS };
  }
  await ctx.kv.set(key, { hits: [...hits, now] });
  return { allowed: true };
};

export const rateLimitResponse = (retryAfterSeconds: number): Response =>
  new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": String(retryAfterSeconds),
    },
  });
