import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";

import factory from "./index.js";
import { OrdersAdminApp, getInitialOrdersAdminRoute } from "./admin/App.js";
import { ordersBackendRoutes } from "@carte/core/contracts";

const CANONICAL_CAPABILITIES = new Set([
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "network:request",
  "email:send",
  "users:read",
]);

describe("@carte/orders-admin manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-orders-admin");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names only", () => {
    const manifest = factory();
    for (const cap of manifest.capabilities) {
      expect(CANONICAL_CAPABILITIES.has(cap)).toBe(true);
    }
    expect(manifest.capabilities).toContain("content:read");
    expect(manifest.capabilities).toContain("content:write");
    expect(manifest.capabilities).not.toContain("network:request");
  });

  it("registers native React admin pages without sandbox-only fields", () => {
    const manifest = factory();
    expect(manifest.admin?.entry).toBe("admin/index.js");
    expect(manifest.admin?.pages).toEqual([
      { path: "/carte-orders", label: "Orders", icon: "shopping-bag" },
      { path: "/carte-orders/modifiers", label: "Modifiers", icon: "sliders" },
    ]);
    expect("allowedHosts" in manifest).toBe(false);
    expect("storage" in manifest).toBe(false);
  });
});

describe("@carte/orders-admin React shell", () => {
  it("mounts a routed shell with links for orders and modifiers", () => {
    render(createElement(OrdersAdminApp, { currentPath: "/carte-orders/modifiers" }));
    expect(screen.getByRole("heading", { name: "Carte Orders" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Orders" }).getAttribute("href")).toBe("/carte-orders");
    expect(screen.getByRole("link", { name: "Modifiers" }).getAttribute("href")).toBe(
      "/carte-orders/modifiers",
    );
    expect(screen.getByRole("heading", { name: "Modifier groups" })).toBeTruthy();
  });

  it("falls back to the orders page for unknown admin paths", () => {
    expect(getInitialOrdersAdminRoute("/unknown")).toBe("/carte-orders");
  });
});

describe("@carte/orders-admin contracts", () => {
  it("uses @carte/core contracts for orders-backend REST routes", () => {
    expect(ordersBackendRoutes.refund).toBe("/refund");
    expect(ordersBackendRoutes.modifierUpdate).toBe("/modifier-update");
    expect(ordersBackendRoutes.orderStateChange).toBe("/order-state-change");
  });
});
