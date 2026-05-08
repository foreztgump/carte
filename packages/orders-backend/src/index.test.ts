import { describe, expect, it } from "vitest";

import type { RouteContext } from "emdash";

import factory from "./index.js";

const CANONICAL_CAPABILITIES = new Set([
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "network:request",
  "email:send",
  "users:read",
]);

describe("@carte/orders-backend manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-orders-backend");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names only and pins allowed Stripe hosts", () => {
    const manifest = factory();
    for (const cap of manifest.capabilities) {
      expect(CANONICAL_CAPABILITIES.has(cap)).toBe(true);
    }
    expect(manifest.capabilities).toEqual([
      "content:read",
      "content:write",
      "email:send",
      "network:request",
    ]);
    expect(manifest.allowedHosts).toEqual(["api.stripe.com", "checkout.stripe.com"]);
    expect(manifest.capabilities).not.toContain("network:request:unrestricted");
  });

  it("declares Stripe and order settings with secret fields protected", () => {
    const manifest = factory();

    expect(manifest.admin.settingsSchema).toMatchObject({
      stripePublicKey: { type: "string" },
      stripeSecretKey: { type: "secret", secret: true },
      stripeWebhookSecret: { type: "secret", secret: true },
      currency: { type: "select", default: "usd" },
      cartHoldTtlSeconds: { type: "number", default: 600 },
      orderTypes: { type: "select", default: "pickup,delivery" },
      pickupLeadMinutes: { type: "number" },
      deliveryLeadMinutes: { type: "number" },
      taxMode: { type: "select" },
      manualVatPercent: { type: "number" },
    });
  });

  it("declares the orders collection for line item snapshot writes", () => {
    const manifest = factory();

    expect(manifest.storage).toEqual({
      carte_orders: {
        indexes: ["status", "orderType", "email", "createdAt", "stripeCheckoutSessionId"],
        uniqueIndexes: ["orderNumber", "stripeCheckoutSessionId"],
      },
    });
  });

  it("snapshots user-visible line item and modifier values at write time", async () => {
    const { createOrderLineItemSnapshot } = await import("./index.js");
    const menuLineItem = {
      menuItemId: "item_123",
      itemName: "Margherita Pizza",
      unitPrice: 1295,
      quantity: 2,
      modifiers: [{ modifierId: "mod_1", modifierName: "Extra basil", priceDelta: 100 }],
    };

    const snapshot = createOrderLineItemSnapshot(menuLineItem);
    menuLineItem.itemName = "Seasonal Pizza";
    menuLineItem.modifiers[0] = {
      modifierId: "mod_1",
      modifierName: "No longer basil",
      priceDelta: 0,
    };

    expect(snapshot).toEqual({
      menuItemId: "item_123",
      itemName: "Margherita Pizza",
      unitPrice: 1295,
      quantity: 2,
      modifiers: [{ modifierId: "mod_1", modifierName: "Extra basil", priceDelta: 100 }],
    });
  });

  it("creates Stripe Checkout sessions and stores cart holds for 600 seconds", async () => {
    const manifest = factory();
    const subrequests: string[] = [];
    const kvWrites: Array<{ key: string; options?: { expirationTtl: number } }> = [];
    const ctx = {
      input: {
        cartId: "cart_123",
        customerEmail: "guest@example.com",
        successUrl: "https://restaurant.example/orders/success",
        cancelUrl: "https://restaurant.example/orders/cancel",
        lineItems: [
          {
            name: "Margherita Pizza",
            unitAmount: 1295,
            quantity: 2,
          },
        ],
      },
      kv: {
        async set(key: string, _value: unknown, options?: { expirationTtl: number }) {
          subrequests.push("kv.set");
          kvWrites.push({ key, options });
        },
      },
      http: {
        async fetch(url: string, init: RequestInit) {
          subrequests.push("http.fetch");
          expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
          expect(init.method).toBe("POST");
          return new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay_123" }));
        },
      },
      settings: { stripeSecretKey: "sk_test_orders", currency: "usd" },
    } as unknown as RouteContext;

    const result = await manifest.routes.checkout.handler(ctx);

    expect(result).toEqual({ checkoutUrl: "https://checkout.stripe.com/c/pay_123" });
    expect(kvWrites).toEqual([{ key: "cart-hold:cart_123", options: { expirationTtl: 600 } }]);
    expect(subrequests).toHaveLength(2);
    expect(subrequests.length).toBeLessThanOrEqual(4);
  });
});
