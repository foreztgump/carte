import { describe, expect, it } from "vitest";

import plugin from "./plugin.js";

const EXPECTED_ROUTE_KEYS = [
  "admin",
  "admin/hours",
  "admin/restaurant",
  "admin/settings",
  "gdpr/erase",
  "gdpr/export",
  "menu-feed",
  "menu-items/86",
  "schema-jsonld",
];

const routeHandler = (key: string): unknown => {
  const route = plugin.routes?.[key];
  return typeof route === "function" ? route : route?.handler;
};

describe("@carte/core sandboxed plugin surface", () => {
  it("default-exports only the SandboxedPlugin hooks + routes contract", () => {
    expect(Object.keys(plugin).sort()).toEqual(["hooks", "routes"]);
  });

  it("registers the content lifecycle hooks", () => {
    expect(Object.keys(plugin.hooks ?? {}).sort()).toEqual([
      "content:afterSave",
      "content:beforeSave",
    ]);
  });

  it("exposes every core route on the sandboxed surface", () => {
    expect(Object.keys(plugin.routes ?? {}).sort()).toEqual(EXPECTED_ROUTE_KEYS);
  });

  it("uses the two-argument sandboxed route ABI", () => {
    for (const key of EXPECTED_ROUTE_KEYS) {
      expect(typeof routeHandler(key)).toBe("function");
    }
  });

  it("keeps GDPR routes non-public so the host enforces admin auth", () => {
    const erase = plugin.routes?.["gdpr/erase"];
    const exportRoute = plugin.routes?.["gdpr/export"];
    const isPublic = (route: typeof erase): boolean =>
      typeof route === "object" && route !== null && route.public === true;
    expect(isPublic(erase)).toBe(false);
    expect(isPublic(exportRoute)).toBe(false);
  });
});
