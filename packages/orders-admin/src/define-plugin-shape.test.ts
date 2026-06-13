import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import factory from "./index.js";
import adminExports from "./admin/index.js";

const ORDERS_PATH = "/carte-orders";
const MODIFIERS_PATH = "/carte-orders/modifiers";

describe("@carte/orders-admin native definePlugin shape (0.18)", () => {
  it("does not carry the dead pre-v0.13 relative admin entry", () => {
    const plugin = factory();
    const entry = plugin.admin?.entry ?? "";
    // The dead shape was a relative module path ending in a JS file; the 0.18
    // shape is a bare package module specifier. Guard regression without
    // embedding the dead literal.
    expect(entry.startsWith("@carte/")).toBe(true);
    expect(/\.js$/.test(entry)).toBe(false);
    expect(entry.includes("/")).toBe(true);
    expect(entry.startsWith(".")).toBe(false);
  });

  it("mounts React admin via the documented package module specifier", () => {
    const plugin = factory();
    expect(plugin.admin?.entry).toBe("@carte/orders-admin/admin");
  });

  it("preserves the declared admin pages", () => {
    const plugin = factory();
    expect(plugin.admin?.pages).toEqual([
      { path: ORDERS_PATH, label: "Orders", icon: "shopping-bag" },
      { path: MODIFIERS_PATH, label: "Modifiers", icon: "sliders" },
    ]);
  });

  it("exposes a PluginAdminExports React mount from ./admin for each page", () => {
    const pages = adminExports.pages ?? {};
    expect(Object.keys(pages)).toEqual([ORDERS_PATH, MODIFIERS_PATH]);
    for (const element of Object.values(pages)) {
      expect(isValidElement(element)).toBe(true);
    }
  });
});
