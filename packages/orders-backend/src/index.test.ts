import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import factory from "./index.js";

import type { RouteContext } from "emdash";

const CANONICAL_CAPABILITIES = new Set([
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "network:request",
  "email:send",
  "users:read",
]);

type RateLimitCounters = {
  get: number;
  set: number;
  setOptions: Array<Record<string, unknown> | undefined>;
};

const ipContext = (ip: string, counters: RateLimitCounters): RouteContext => {
  const store = new Map<string, unknown>();
  return {
    input: {},
    request: new Request("https://example.test/checkout"),
    requestMeta: { ip, userAgent: null, referer: null, geo: null },
    kv: {
      async get<T>(key: string): Promise<T | null> {
        counters.get += 1;
        return (store.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown, options?: Record<string, unknown>): Promise<void> {
        counters.set += 1;
        counters.setOptions.push(options);
        store.set(key, value);
      },
      async delete(): Promise<boolean> {
        return false;
      },
      async list(): Promise<Array<{ key: string; value: unknown }>> {
        return [];
      },
    },
  } as unknown as RouteContext;
};

const checkoutHandler = () => {
  const handler = factory().routes.checkout?.handler;
  if (handler === undefined) throw new Error("checkout route missing");
  return handler;
};

const webhookHandler = () => {
  const handler = factory().routes["webhook-stripe"]?.handler;
  if (handler === undefined) throw new Error("webhook route missing");
  return handler;
};

const webhookContext = (eventId: string, writes: string[]): RouteContext =>
  ({
    input: { event: { id: eventId, type: "checkout.session.completed" } },
    request: new Request("https://example.test/webhook-stripe", { method: "POST" }),
    kv: {
      async get<T>(key: string): Promise<T | null> {
        return writes.includes(key) ? ("processed" as T) : null;
      },
      async set(key: string): Promise<void> {
        writes.push(key);
      },
    },
    waitUntil(promise: Promise<unknown>): void {
      void promise;
    },
  }) as unknown as RouteContext;

describe("@carte/orders-backend manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-orders-backend");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names only and pins allowed Stripe hosts", () => {
    const manifest = factory();
    for (const cap of manifest.capabilities) {
      expect(CANONICAL_CAPABILITIES.has(cap)).toBe(true);
    }
    expect(manifest.capabilities).toContain("network:request");
    expect(manifest.allowedHosts).toEqual(
      expect.arrayContaining(["api.stripe.com", "checkout.stripe.com"]),
    );
  });
});

describe("@carte/orders-backend webhook pen smoke", () => {
  it("treats replayed Stripe events as 200 no-op responses", async () => {
    const eventId = "evt_replay_probe_001";
    const writes: string[] = [];
    const handler = webhookHandler();

    const first = await handler(webhookContext(eventId, writes));
    const replay = await handler(webhookContext(eventId, writes));

    expect(first).toBeInstanceOf(Response);
    expect((first as Response).status).toBe(200);
    expect(replay).toBeInstanceOf(Response);
    expect((replay as Response).status).toBe(200);
    expect(await (replay as Response).json()).toMatchObject({ ok: true, replay: true });
    expect(writes).toEqual([`idempotency:${eventId}`]);
  });
});

describe("@carte/orders-backend checkout rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttles burst traffic from one IP inside a 60 second window", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = ipContext("203.0.113.20", counters);
    const handler = checkoutHandler();

    const responses = [];
    for (let index = 0; index < 100; index += 1) responses.push(await handler(ctx));

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
    const firstThrottled = responses[60];
    expect(firstThrottled).toBeInstanceOf(Response);
    expect((firstThrottled as Response).status).toBe(429);
    expect(counters.get).toBe(100);
    expect(counters.set).toBe(60);
  });

  it("allows legitimate one request per second traffic", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = ipContext("203.0.113.21", counters);
    const handler = checkoutHandler();

    const responses = [];
    for (let index = 0; index < 100; index += 1) {
      vi.setSystemTime(new Date(Date.UTC(2026, 4, 8, 12, 0, index)));
      responses.push(await handler(ctx));
    }

    expect(responses.every((response) => !(response instanceof Response))).toBe(true);
    expect(counters.get).toBe(100);
    expect(counters.set).toBe(100);
  });

  it("writes rate-limit counters with a TTL covering the 60s window", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = ipContext("203.0.113.22", counters);
    const handler = checkoutHandler();

    await handler(ctx);

    expect(counters.set).toBe(1);
    expect(counters.setOptions[0]).toMatchObject({ expirationTtl: 120 });
  });

  it("does not let spoofed x-forwarded-for bypass rate limit when ip is null", async () => {
    const baseStore = new Map<string, unknown>();
    const sharedKv = {
      async get<T>(key: string): Promise<T | null> {
        return (baseStore.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown): Promise<void> {
        baseStore.set(key, value);
      },
    };
    const handler = checkoutHandler();
    // requestMeta.ip is null and cf-connecting-ip is missing. The attacker
    // rotates x-forwarded-for hoping to dodge per-IP throttling. The limiter
    // must NOT key on x-forwarded-for — those requests fall into one
    // untrusted bucket and get throttled together.
    const buildCtx = (xff: string): RouteContext =>
      ({
        input: {},
        request: new Request("https://example.test/checkout", {
          headers: { "x-forwarded-for": xff },
        }),
        requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
        kv: sharedKv,
      }) as unknown as RouteContext;

    const responses = [];
    for (let index = 0; index < 100; index += 1) {
      responses.push(await handler(buildCtx(`10.0.0.${index}`)));
    }

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
  });
});
