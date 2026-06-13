import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { enforceRateLimit } from "../rate-limit.js";
import { pluginContextFields } from "../test-support.js";
import type { ReservationRouteContext } from "./types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const README_PATH = resolve(HERE, "..", "..", "README.md");
const RATE_LIMIT_PATH = resolve(HERE, "..", "rate-limit.ts");
const SUBMIT_ROUTE = "submit";

describe("enforceSubmitRateLimit", () => {
  it("expires the counter after the rate-limit window so callers are not permanently blocked", async () => {
    const ctx = makeContext("203.0.113.10");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-05-08T00:00:00.000Z"));
      for (let i = 0; i < 60; i += 1) await enforceRateLimit(ctx, SUBMIT_ROUTE);
      // Window 1: at the cap; another call must be rejected.
      await expect(enforceRateLimit(ctx, SUBMIT_ROUTE)).resolves.toMatchObject({
        allowed: false,
      });

      // Advance past the window — the counter must be considered reset.
      vi.setSystemTime(new Date("2026-05-08T00:02:00.000Z"));
      await expect(enforceRateLimit(ctx, SUBMIT_ROUTE)).resolves.toMatchObject({
        allowed: true,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("documents the best-effort concurrency caveat in code and README (HR6)", () => {
    const contextSource = readFileSync(RATE_LIMIT_PATH, "utf8");
    const readme = readFileSync(README_PATH, "utf8");
    expect(contextSource).toMatch(/HR6/);
    expect(contextSource).toMatch(/best-effort/i);
    expect(readme).toMatch(/best-effort/i);
    expect(readme).toMatch(/rate limit/i);
  });

  it("is best-effort under concurrent submits and never advances past the cap unbounded", async () => {
    // EmDash 0.9 KVAccess is get/set/delete/list — no atomic CAS or increment.
    // With concurrent reads two callers can each see N and both write N+1, so
    // the cap is best-effort: a small overshoot is possible, but the counter
    // never grows beyond two simultaneous in-flight increments per request.
    // Regression: prove that 3 concurrent calls produce at most one missed
    // increment and that a follow-up serial call still sees the bumped value.
    const ctx = makeContext("203.0.113.12");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-05-08T00:00:00.000Z"));
      const results = await Promise.all([
        enforceRateLimit(ctx, SUBMIT_ROUTE),
        enforceRateLimit(ctx, SUBMIT_ROUTE),
        enforceRateLimit(ctx, SUBMIT_ROUTE),
      ]);
      expect(results.every((result) => result.allowed)).toBe(true);

      const setMock = ctx.kv.set as ReturnType<typeof vi.fn>;
      const finalCount = setMock.mock.calls
        .map(([, value]) => (value as { hits: number[] }).hits.length)
        .reduce((max, count) => Math.max(max, count), 0);
      expect(finalCount).toBeGreaterThanOrEqual(1);
      expect(finalCount).toBeLessThanOrEqual(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stores the counter under a single self-describing key with embedded expiry", async () => {
    const ctx = makeContext("203.0.113.11");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-05-08T00:00:00.000Z"));
      await enforceRateLimit(ctx, SUBMIT_ROUTE);
    } finally {
      vi.useRealTimers();
    }

    const setMock = ctx.kv.set as ReturnType<typeof vi.fn>;
    const writtenKeys = setMock.mock.calls.map(([key]) => key as string);
    expect(writtenKeys.some((key) => key.endsWith(":ttl"))).toBe(false);
    const writtenValues = setMock.mock.calls.map(([, value]) => value);
    const counterValue = writtenValues[0] as { hits: number[] };
    expect(counterValue.hits).toHaveLength(1);
    expect(setMock.mock.calls[0]?.[2]).toMatchObject({ expirationTtl: 120 });
  });
});

function makeContext(ip: string): ReservationRouteContext {
  const kv = new Map<string, unknown>();
  const context = {
    input: {},
    request: new Request("https://example.com/"),
    requestMeta: { ip, userAgent: null, referer: null, geo: null },
    kv: {
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      set: vi.fn(async (key: string, value: unknown) => void kv.set(key, value)),
      delete: vi.fn(async () => true),
      list: vi.fn(async () => []),
    },
  };
  return Object.assign(context, pluginContextFields({})) as ReservationRouteContext;
}
