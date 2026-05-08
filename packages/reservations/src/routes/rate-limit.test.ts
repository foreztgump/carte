import { describe, expect, it, vi } from "vitest";

import { enforceSubmitRateLimit } from "./context.js";
import type { ReservationRouteContext } from "./types.js";

describe("enforceSubmitRateLimit", () => {
  it("expires the counter after the rate-limit window so callers are not permanently blocked", async () => {
    const ctx = makeContext("203.0.113.10");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-05-08T00:00:00.000Z"));
      for (let i = 0; i < 30; i += 1) await enforceSubmitRateLimit(ctx);
      // Window 1: at the cap; another call must be rejected.
      await expect(enforceSubmitRateLimit(ctx)).resolves.toBe(false);

      // Advance past the window — the counter must be considered reset.
      vi.setSystemTime(new Date("2026-05-08T00:02:00.000Z"));
      await expect(enforceSubmitRateLimit(ctx)).resolves.toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stores the counter under a single self-describing key with embedded expiry", async () => {
    const ctx = makeContext("203.0.113.11");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-05-08T00:00:00.000Z"));
      await enforceSubmitRateLimit(ctx);
    } finally {
      vi.useRealTimers();
    }

    const setMock = ctx.kv.set as ReturnType<typeof vi.fn>;
    const writtenKeys = setMock.mock.calls.map(([key]) => key as string);
    expect(writtenKeys.some((key) => key.endsWith(":ttl"))).toBe(false);
    const writtenValues = setMock.mock.calls.map(([, value]) => value);
    const counterValue = writtenValues[0] as { count: number; expiresAt: number };
    expect(counterValue.count).toBe(1);
    expect(typeof counterValue.expiresAt).toBe("number");
    expect(counterValue.expiresAt).toBeGreaterThan(Date.parse("2026-05-08T00:00:00.000Z"));
  });
});

function makeContext(ip: string): ReservationRouteContext {
  const kv = new Map<string, unknown>();
  return {
    input: {},
    request: new Request("https://example.com/"),
    requestMeta: { ip, userAgent: null, referer: null, geo: null },
    kv: {
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      set: vi.fn(async (key: string, value: unknown) => void kv.set(key, value)),
      delete: vi.fn(async () => undefined),
      list: vi.fn(async () => []),
    },
    storage: {},
  } as unknown as ReservationRouteContext;
}
