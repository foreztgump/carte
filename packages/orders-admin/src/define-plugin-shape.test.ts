import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import factory from "./index.js";
import adminExports, { pages } from "./admin/index.js";

afterEach(cleanup);

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

  it("exposes `pages` as a NAMED export keyed by admin page path", () => {
    expect(Object.keys(pages)).toEqual([ORDERS_PATH, MODIFIERS_PATH]);
    expect(adminExports.pages).toBe(pages);
  });

  it("stores each page value as a renderable component function, not an element", () => {
    for (const page of Object.values(pages)) {
      expect(typeof page).toBe("function");
    }
  });

  it("renders the orders page component into the orders admin UI", () => {
    render(createElement(pages[ORDERS_PATH]!));
    expect(screen.getByRole("heading", { name: "Carte Orders" })).toBeTruthy();
  });

  it("renders the modifiers page component into the modifier groups UI", () => {
    render(createElement(pages[MODIFIERS_PATH]!));
    expect(screen.getByRole("heading", { name: "Modifier groups" })).toBeTruthy();
  });
});
