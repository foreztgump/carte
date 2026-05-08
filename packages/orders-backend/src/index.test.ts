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

const ipContext = (ip: string, counters: { get: number; set: number }): RouteContext => {
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
      async set(key: string, value: unknown): Promise<void> {
        counters.set += 1;
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
    const counters = { get: 0, set: 0 };
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
    const counters = { get: 0, set: 0 };
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
});
