import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

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
    expect(manifest.allowedHosts).toEqual([]);
    expect(manifest.storage).toEqual({});
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

const fixtureOrders = [
  {
    id: "order-101",
    customerName: "Ada Lovelace",
    placedAt: "2026-05-07T18:30:00.000Z",
    status: "pending" as const,
    totalCents: 2450,
    lineItems: [
      {
        id: "line-1",
        itemName: "Margherita Pizza",
        unitPriceCents: 1800,
        quantity: 1,
        modifiers: [
          { id: "mod-1", name: "Buffalo mozzarella", feeCents: 250 },
          { id: "mod-2", name: "Chili oil", feeCents: 0 },
        ],
      },
    ],
  },
  {
    id: "order-102",
    customerName: "Grace Hopper",
    placedAt: "2026-05-08T19:00:00.000Z",
    status: "ready" as const,
    totalCents: 1600,
    lineItems: [
      {
        id: "line-2",
        itemName: "Caesar Salad",
        unitPriceCents: 1600,
        quantity: 1,
        modifiers: [{ id: "mod-3", name: "No anchovies", feeCents: 0 }],
      },
    ],
  },
];

describe("@carte/orders-admin order workflows", () => {
  it("renders fixture orders with status and date filters", () => {
    render(createElement(OrdersAdminApp, { initialOrders: fixtureOrders }));

    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("Grace Hopper")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ready" } });
    expect(screen.queryByText("Ada Lovelace")).toBeNull();
    expect(screen.getByText("Grace Hopper")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-05-09" } });
    expect(screen.queryByText("Grace Hopper")).toBeNull();
    expect(screen.getByText("No orders match the current filters.")).toBeTruthy();
  });

  it("shows order detail using snapshotted line item and modifier names", () => {
    render(createElement(OrdersAdminApp, { initialOrders: fixtureOrders }));

    fireEvent.click(screen.getByRole("button", { name: "View order-101" }));

    expect(screen.getByRole("heading", { name: "Order order-101" })).toBeTruthy();
    expect(screen.getByText("Margherita Pizza")).toBeTruthy();
    expect(screen.getByText("Buffalo mozzarella")).toBeTruthy();
    expect(screen.getByText("Chili oil")).toBeTruthy();
  });

  it("posts refunds to the typed backend route and updates the UI", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        orderId: "order-101",
        status: "refunded",
        refundId: "rf_123",
        refundedAt: "2026-05-08T20:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(createElement(OrdersAdminApp, { initialOrders: fixtureOrders }));
    fireEvent.click(screen.getByRole("button", { name: "View order-101" }));
    fireEvent.click(screen.getByRole("button", { name: "Issue refund" }));

    await screen.findByText("Refund rf_123 issued at May 8, 2026, 8:00 PM");
    expect(fetchMock).toHaveBeenCalledWith(
      "/_emdash/api/plugins/carte-orders-backend/refund",
      expect.objectContaining({
        body: JSON.stringify({ orderId: "order-101" }),
        method: "POST",
      }),
    );
  });

  it("surfaces status-driven transitions and disables invalid transitions", async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url, init) => ({
      ok: true,
      json: async () => ({
        orderId: JSON.parse(String(init.body)).orderId,
        status: JSON.parse(String(init.body)).nextStatus,
        updatedAt: "2026-05-08T21:00:00.000Z",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(createElement(OrdersAdminApp, { initialOrders: fixtureOrders }));
    fireEvent.click(screen.getByRole("button", { name: "View order-101" }));

    fireEvent.click(screen.getByRole("button", { name: "Mark preparing" }));
    await screen.findByText("Status: preparing");
    fireEvent.click(screen.getByRole("button", { name: "Mark ready" }));
    await screen.findByText("Status: ready");
    fireEvent.click(screen.getByRole("button", { name: "Mark completed" }));
    await screen.findByText("Status: completed");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(screen.getByRole("button", { name: "Mark completed" })).toBeDisabled();
  });

  it("edits email-first notification templates with rendered previews", () => {
    render(createElement(OrdersAdminApp, { initialOrders: fixtureOrders }));

    fireEvent.change(screen.getByLabelText("Ready email subject"), {
      target: { value: "Order {{orderId}} is ready" },
    });
    fireEvent.change(screen.getByLabelText("Ready email body"), {
      target: { value: "Hi {{customerName}}, collect {{orderId}}." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save email template" }));

    expect(screen.getByText("Template saved for email notifications.")).toBeTruthy();
    expect(screen.getByText("Order order-101 is ready")).toBeTruthy();
    expect(screen.getByText("Hi Ada Lovelace, collect order-101.")).toBeTruthy();
  });
});
