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
    request: new Request("https://example.test/submit"),
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

const submitHandler = () => {
  const handler = factory().routes.submit?.handler;
  if (handler === undefined) throw new Error("submit route missing");
  return handler;
};

const capacityContext = (key: string, decrement: () => Promise<number>): RouteContext =>
  ({
    input: { capacityKey: key },
    request: new Request("https://example.test/submit", { method: "POST" }),
    requestMeta: { ip: "203.0.113.200", userAgent: null, referer: null, geo: null },
    kv: { atomicDecrement: decrement },
  }) as unknown as RouteContext;

describe("@carte/reservations manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-reservations");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names only", () => {
    const manifest = factory();
    for (const cap of manifest.capabilities) {
      expect(CANONICAL_CAPABILITIES.has(cap)).toBe(true);
    }
    expect(manifest.capabilities).toContain("content:read");
    expect(manifest.capabilities).toContain("content:write");
    expect(manifest.capabilities).toContain("email:send");
  });
});

describe("@carte/reservations capacity pen smoke", () => {
  it("does not oversell under 1000 concurrent submits for capacity 200", async () => {
    let remainingSeats = 200;
    const handler = submitHandler();
    const decrement = async () => {
      if (remainingSeats <= 0) return -1;
      remainingSeats -= 1;
      return remainingSeats;
    };

    const responses = await Promise.all(
      Array.from({ length: 1_000 }, () =>
        handler(capacityContext("capacity:2026-05-08T19", decrement)),
      ),
    );

    const successful = responses.filter(
      (response) => !(response instanceof Response) || response.status < 400,
    );
    expect(successful).toHaveLength(200);
    expect(remainingSeats).toBe(0);
  });
});

describe("@carte/reservations submit rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttles burst traffic from one IP inside a 60 second window", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = ipContext("203.0.113.10", counters);
    const handler = submitHandler();

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
    const ctx = ipContext("203.0.113.11", counters);
    const handler = submitHandler();

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
    const ctx = ipContext("203.0.113.12", counters);
    const handler = submitHandler();

    await handler(ctx);

    expect(counters.set).toBe(1);
    expect(counters.setOptions[0]).toMatchObject({ expirationTtl: 120 });
  });
});
