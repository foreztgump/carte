import { describe, expect, it, vi } from "vitest";

import plugin from "./plugin.js";
import { pluginContextFields } from "./test-support.js";

const EXPECTED_ROUTE_KEYS = [
  "admin",
  "admin/blocks",
  "admin/settings",
  "cancel-by-token",
  "confirm",
  "submit",
];

const routeHandler = (key: string): unknown => {
  const route = plugin.routes?.[key];
  return typeof route === "function" ? route : route?.handler;
};

describe("@carte/reservations sandboxed plugin surface", () => {
  it("default-exports only the SandboxedPlugin routes contract", () => {
    expect(Object.keys(plugin).sort()).toEqual(["routes"]);
  });

  it("exposes every reservations route on the sandboxed surface", () => {
    expect(Object.keys(plugin.routes ?? {}).sort()).toEqual(EXPECTED_ROUTE_KEYS);
  });

  it("uses the two-argument sandboxed route ABI", () => {
    for (const key of EXPECTED_ROUTE_KEYS) {
      expect(typeof routeHandler(key)).toBe("function");
    }
  });

  it("keeps public reservation routes marked public", () => {
    expect(plugin.routes?.submit).toMatchObject({ public: true });
    expect(plugin.routes?.confirm).toMatchObject({ public: true });
    expect(plugin.routes?.["cancel-by-token"]).toMatchObject({ public: true });
  });

  it("threads the sandbox requestMeta into the per-IP rate-limit key", async () => {
    const clientIp = "198.51.100.77";
    const kv = new Map<string, unknown>();
    const setKeys: string[] = [];
    const ctx = Object.assign(
      {
        kv: {
          get: vi.fn(async (key: string) => kv.get(key) ?? null),
          set: vi.fn(async (key: string, value: unknown) => {
            setKeys.push(key);
            kv.set(key, value);
          }),
          delete: vi.fn(async () => true),
          list: vi.fn(async () => []),
        },
      },
      pluginContextFields({}),
    );
    const routeCtx = {
      input: {},
      request: { url: "https://example.com/submit", method: "POST", headers: new Headers() },
      requestMeta: { ip: clientIp, userAgent: null, referer: null, geo: null },
    };

    const submit = plugin.routes?.submit;
    const handler = typeof submit === "function" ? submit : submit?.handler;
    await handler?.(routeCtx as never, ctx as never);

    expect(setKeys.some((key) => key.includes(encodeURIComponent(clientIp)))).toBe(true);
  });
});
