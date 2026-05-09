import { describe, expect, it, vi } from "vitest";

import { getTokenSecret } from "./context.js";
import type { ReservationRouteContext } from "./types.js";

describe("getTokenSecret", () => {
  it("returns the configured secret from settings:tokenSecret", async () => {
    const ctx = makeContext("configured-secret");

    await expect(getTokenSecret(ctx)).resolves.toBe("configured-secret");
  });

  it("rejects when settings:tokenSecret is unset to prevent token forgery", async () => {
    const ctx = makeContext(null);

    await expect(getTokenSecret(ctx)).rejects.toThrow(/tokenSecret/i);
  });
});

function makeContext(secret: string | null): ReservationRouteContext {
  const kv = new Map<string, unknown>();
  if (secret !== null) kv.set("settings:tokenSecret", secret);
  return {
    input: {},
    request: new Request("https://example.com/"),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
    kv: {
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      set: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
      list: vi.fn(async () => []),
    },
    storage: {},
  } as unknown as ReservationRouteContext;
}
