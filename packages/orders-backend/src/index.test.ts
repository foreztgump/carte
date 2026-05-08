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
          if (options) {
            kvWrites.push({ key, options });
          }
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

    const checkoutRoute = manifest.routes.checkout;
    expect(checkoutRoute).toBeDefined();

    const result = await checkoutRoute?.handler(ctx);

    expect(result).toEqual({ checkoutUrl: "https://checkout.stripe.com/c/pay_123" });
    expect(kvWrites).toEqual([{ key: "cart-hold:cart_123", options: { expirationTtl: 600 } }]);
    expect(subrequests).toHaveLength(2);
    expect(subrequests.length).toBeLessThanOrEqual(4);
  });

  it("rejects Stripe webhooks with an invalid signature before state reads", async () => {
    const manifest = factory();
    const stateReads: string[] = [];
    const ctx = {
      input: {
        body: JSON.stringify(stripeCheckoutCompletedEvent()),
        headers: { "stripe-signature": "t=1700000000,v1=bad" },
      },
      kv: {
        async get(key: string) {
          stateReads.push(key);
          return undefined;
        },
      },
      settings: { stripeWebhookSecret: "whsec_test_orders" },
      waitUntil() {
        throw new Error("waitUntil must not run for invalid signatures.");
      },
    } as unknown as RouteContext;

    await expect(manifest.routes["webhook-stripe"]?.handler(ctx)).resolves.toEqual({
      ok: false,
      status: 400,
    });
    expect(stateReads).toEqual([]);
  });

  it("creates one order for replayed Stripe webhook deliveries", async () => {
    const manifest = factory();
    const event = stripeCheckoutCompletedEvent();
    const body = JSON.stringify(event);
    const signature = await stripeSignatureHeader(body, "whsec_test_orders");
    const processedKeys = new Set<string>();
    const subrequests: string[] = [];
    const orders: unknown[] = [];
    const emails: unknown[] = [];
    const waitUntilTasks: Promise<unknown>[] = [];
    const ctx = {
      input: { body, headers: { "stripe-signature": signature } },
      kv: {
        async get(key: string) {
          subrequests.push("kv.get");
          return processedKeys.has(key) ? "processed" : undefined;
        },
        async set(key: string, value: string, options: { expirationTtl: number }) {
          subrequests.push("kv.set");
          expect(key).toBe("idempotency:evt_checkout_completed");
          expect(value).toBe("processed");
          expect(options).toEqual({ expirationTtl: 604800 });
          processedKeys.add(key);
        },
      },
      content: {
        async create(collection: string, order: unknown) {
          subrequests.push("content.create");
          expect(collection).toBe("carte_orders");
          orders.push(order);
        },
      },
      email: {
        async send(message: unknown) {
          subrequests.push("email.send");
          emails.push(message);
        },
      },
      settings: { stripeWebhookSecret: "whsec_test_orders" },
      waitUntil(task: Promise<unknown>) {
        waitUntilTasks.push(task);
      },
    } as unknown as RouteContext;

    await expect(manifest.routes["webhook-stripe"]?.handler(ctx)).resolves.toEqual({
      ok: true,
      status: 200,
      idempotent: false,
    });
    await Promise.all(waitUntilTasks);
    await expect(manifest.routes["webhook-stripe"]?.handler(ctx)).resolves.toEqual({
      ok: true,
      status: 200,
      idempotent: true,
    });

    expect(waitUntilTasks).toHaveLength(1);
    expect(orders).toHaveLength(1);
    expect(emails).toHaveLength(1);
    expect(subrequests.length).toBeLessThanOrEqual(7);
  });
});

const stripeCheckoutCompletedEvent = () => ({
  id: "evt_checkout_completed",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      customer_email: "guest@example.com",
      amount_total: 2590,
      currency: "usd",
      metadata: { cartId: "cart_123", orderType: "pickup" },
    },
  },
});

const stripeSignatureHeader = async (body: string, secret: string): Promise<string> => {
  const timestamp = 1_700_000_000;
  const signedPayload = `${timestamp}.${body}`;
  const signature = await hmacSha256Hex(secret, signedPayload);
  return `t=${timestamp},v1=${signature}`;
};

const hmacSha256Hex = async (secret: string, payload: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
