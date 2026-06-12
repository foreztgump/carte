import { describe, expect, it } from "vitest";

import plugin from "./plugin.js";

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
});
