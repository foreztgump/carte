import { describe, expect, it } from "vitest";

import plugin from "./plugin.js";

const EXPECTED_ROUTE_KEYS = ["admin", "checkout", "refund"];

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

  it("keeps the public checkout route marked public and admin/refund private", () => {
    expect(plugin.routes?.checkout).toMatchObject({ public: true });
    expect(plugin.routes?.admin).not.toHaveProperty("public");
    expect(plugin.routes?.refund).not.toHaveProperty("public");
  });

  it("registers no Tender payment hooks (dead tender:* eventing purged)", () => {
    expect(plugin.hooks).toBeUndefined();
  });
});
