import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import plugin from "./plugin.js";

import type { PluginContext, SandboxedRouteContext } from "emdash/plugin";

describe("@carte/reservations manifest", () => {
  it("declares public reservation and admin wildcard routes", () => {
    expect(Object.keys(plugin.routes ?? {}).sort()).toEqual([
      "admin",
      "admin/blocks",
      "admin/settings",
      "cancel-by-token",
      "confirm",
      "submit",
    ]);
    expect(plugin.routes?.submit).toMatchObject({ public: true });
    expect(plugin.routes?.confirm).toMatchObject({ public: true });
    expect(plugin.routes?.["cancel-by-token"]).toMatchObject({ public: true });
  });
});

type RateLimitCounters = {
  get: number;
  set: number;
  setOptions: Array<Record<string, unknown> | undefined>;
};

const ipContext = (counters: RateLimitCounters): PluginContext => {
  const store = new Map<string, unknown>();
  return {
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
    },
  } as PluginContext;
};

const submitHandler = () => {
  const route = plugin.routes?.submit;
  if (typeof route !== "object" || route === null) throw new Error("submit route missing");
  return route.handler;
};

const routeContext = (
  ip: string | null,
  request = new Request("https://example.test/submit"),
): SandboxedRouteContext => ({
  input: {},
  request: {
    url: request.url,
    method: request.method,
    headers: requestHeaders(request),
  },
  requestMeta: { ip, userAgent: null, referer: null, geo: null },
});

function requestHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, name) => {
    headers[name] = value;
  });
  return headers;
}

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
    const ctx = ipContext(counters);
    const routeCtx = routeContext("203.0.113.10");
    const handler = submitHandler();

    const responses = [];
    for (let index = 0; index < 100; index += 1) responses.push(await handler(routeCtx, ctx));

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
    expect(responses[60]).toBeInstanceOf(Response);
    expect((responses[60] as Response).status).toBe(429);
    expect(counters.get).toBe(100);
    expect(counters.set).toBe(60);
  });

  it("allows legitimate one request per second traffic", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = ipContext(counters);
    const handler = submitHandler();

    const responses = [];
    for (let index = 0; index < 100; index += 1) {
      vi.setSystemTime(new Date(Date.UTC(2026, 4, 8, 12, 0, index)));
      responses.push(await handler(routeContext("203.0.113.11"), ctx));
    }

    expect(responses.every((response) => !(response instanceof Response))).toBe(true);
    expect(counters.get).toBe(100);
    expect(counters.set).toBe(100);
  });

  it("writes rate-limit counters with a TTL covering the 60s window", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = ipContext(counters);
    const handler = submitHandler();

    await handler(routeContext("203.0.113.12"), ctx);

    expect(counters.set).toBe(1);
    expect(counters.setOptions[0]).toMatchObject({ expirationTtl: 120 });
  });

  it("does not let spoofed x-forwarded-for bypass submit rate limit when ip is null", async () => {
    const baseStore = new Map<string, unknown>();
    const sharedKv = {
      async get<T>(key: string): Promise<T | null> {
        return (baseStore.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown): Promise<void> {
        baseStore.set(key, value);
      },
    };
    const handler = submitHandler();
    const pluginCtx = {
      kv: sharedKv,
    } as PluginContext;
    const buildRouteCtx = (xff: string): SandboxedRouteContext =>
      routeContext(
        null,
        new Request("https://example.test/submit", {
          headers: { "x-forwarded-for": xff },
        }),
      );

    const responses = [];
    for (let index = 0; index < 100; index += 1) {
      responses.push(await handler(buildRouteCtx(`10.0.0.${index}`), pluginCtx));
    }

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
  });
});
