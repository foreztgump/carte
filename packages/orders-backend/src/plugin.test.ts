import { describe, expect, it, vi } from "vitest";

import plugin from "./plugin.js";

const EXPECTED_ROUTE_KEYS = ["admin", "checkout", "refund", "return"];

const routeHandler = (key: string): unknown => {
  const route = plugin.routes?.[key];
  return typeof route === "function" ? route : route?.handler;
};

describe("@carte/orders-backend sandboxed plugin surface", () => {
  it("default-exports only the SandboxedPlugin routes contract", () => {
    expect(Object.keys(plugin).sort()).toEqual(["routes"]);
  });

  it("exposes every orders-backend route on the sandboxed surface", () => {
    expect(Object.keys(plugin.routes ?? {}).sort()).toEqual(EXPECTED_ROUTE_KEYS);
  });

  it("uses the two-argument sandboxed route ABI", () => {
    for (const key of EXPECTED_ROUTE_KEYS) {
      expect(typeof routeHandler(key)).toBe("function");
    }
  });

  it("keeps the customer-facing checkout and return routes public and admin/refund private", () => {
    expect(plugin.routes?.checkout).toMatchObject({ public: true });
    expect(plugin.routes?.return).toMatchObject({ public: true });
    expect(plugin.routes?.admin).not.toHaveProperty("public");
    expect(plugin.routes?.refund).not.toHaveProperty("public");
  });

  it("registers no Tender payment hooks (dead tender:* eventing purged)", () => {
    expect(plugin.hooks).toBeUndefined();
  });

  it("threads the sandbox requestMeta into the per-IP checkout rate-limit key", async () => {
    const clientIp = "198.51.100.21";
    const setKeys: string[] = [];
    const ctx = {
      plugin: { id: "carte-orders-backend", version: "0.1.0" },
      storage: {},
      log: { debug() {}, info() {}, warn() {}, error() {} },
      site: { name: "Carte Test", url: "https://example.test", locale: "en" },
      url: (path: string) => new URL(path, "https://example.test").toString(),
      kv: {
        get: vi.fn(async () => null),
        set: vi.fn(async (key: string) => {
          setKeys.push(key);
        }),
        delete: vi.fn(async () => true),
        list: vi.fn(async () => []),
      },
    };
    const routeCtx = {
      input: {},
      request: { url: "https://example.test/checkout", method: "POST", headers: new Headers() },
      requestMeta: { ip: clientIp, userAgent: null, referer: null, geo: null },
    };

    const checkout = plugin.routes?.checkout;
    const handler = typeof checkout === "function" ? checkout : checkout?.handler;
    // The empty input throws downstream of the rate limiter; the per-IP key is
    // written before validation, which is exactly what this test asserts.
    await handler?.(routeCtx as never, ctx as never).catch(() => undefined);

    expect(setKeys.some((key) => key.includes(encodeURIComponent(clientIp)))).toBe(true);
  });
});
