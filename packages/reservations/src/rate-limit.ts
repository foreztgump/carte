import type { RouteContext } from "emdash";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const RETRY_AFTER_SECONDS = 60;
const KV_EXPIRATION_TTL_SECONDS = 120;

type RateLimitState = {
  hits: number[];
};

type RateLimitKv = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { expirationTtl: number }): Promise<void>;
};

type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

const rateLimitKey = (route: string, ip: string): string =>
  `rate-limit:${route}:${encodeURIComponent(ip)}`;

// Trust only Cloudflare-supplied identifiers in a Worker context.
// `x-forwarded-for` is client-controlled and rotating it would let an
// attacker evade per-IP throttling, so it is intentionally NOT consulted.
// When neither source is available we fall back to a single "untrusted"
// bucket so traffic still pays the rate-limit toll instead of bypassing it.
const UNTRUSTED_IP_BUCKET = "untrusted";

const clientIp = (ctx: RouteContext): string =>
  ctx.requestMeta?.ip ?? ctx.request?.headers.get("cf-connecting-ip") ?? UNTRUSTED_IP_BUCKET;

const storedHits = (state: RateLimitState | null, windowStart: number): number[] =>
  state?.hits.filter((hit) => Number.isSafeInteger(hit) && hit > windowStart) ?? [];

/**
 * Subrequest audit for /submit: 1 KV read + 1 KV write on accepted requests,
 * 1 KV read on throttled requests. Added subrequests per invocation: ≤ 2.
 * HR6: KV read-then-write remains a best-effort per-IP throttle under
 * concurrent requests; it is not an authorization or capacity primitive.
 */
export const enforceRateLimit = async (
  ctx: RouteContext,
  route: string,
): Promise<RateLimitResult> => {
  const now = Date.now();
  const key = rateLimitKey(route, clientIp(ctx));
  const kv = ctx.kv as RateLimitKv;
  const hits = storedHits(await kv.get<RateLimitState>(key), now - WINDOW_MS);
  if (hits.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: RETRY_AFTER_SECONDS };
  }
  await kv.set(key, { hits: [...hits, now] }, { expirationTtl: KV_EXPIRATION_TTL_SECONDS });
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
