// @carte/orders-backend — sandboxed EmDash plugin skeleton.
//
// v0.1 scope (later mission): Stripe Checkout creation, idempotent
// webhook receiver, refund. Stripe Checkout handles all payment-card
// details; Carte infrastructure receives only Stripe tokens. The webhook is
// idempotent via `ctx.kv` `idempotency:{stripeEventId}` with 7-day TTL.
//
// Sandbox budget: each handler must fit inside 50ms CPU + 10 subrequests
// + 30s wall-time + ~128MB memory. The future webhook is expected to use
// ~7 of 10 subrequests; stay within budget.

import { definePlugin } from "emdash";

import type { RouteContext } from "emdash";

import { checkoutRoute } from "./routes/checkout.js";

const PLUGIN_ID = "carte-orders-backend";
const PLUGIN_VERSION = "0.1.0";
const CART_HOLD_TTL_SECONDS = 600;

interface SettingFieldWithSecretMarker {
  type: "string" | "number" | "select" | "secret";
  label: string;
  description?: string;
  default?: string | number;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  secret?: true;
}

interface SourceModifierSelection {
  modifierId: string;
  modifierName: string;
  priceDelta: number;
}

interface SourceOrderLineItem {
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  modifiers: SourceModifierSelection[];
}

export interface OrderLineItemSnapshot {
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  modifiers: SourceModifierSelection[];
}

const settingsSchema = {
  stripePublicKey: {
    type: "string",
    label: "Stripe publishable key",
    description: "Publishable key used to initialize Stripe Checkout.",
  },
  stripeSecretKey: {
    type: "secret",
    label: "Stripe secret key",
    description: "Secret API key used for server-side Stripe requests.",
    secret: true,
  },
  stripeWebhookSecret: {
    type: "secret",
    label: "Stripe webhook signing secret",
    description: "Secret used to verify incoming Stripe webhook events.",
    secret: true,
  },
  currency: {
    type: "select",
    label: "Currency",
    default: "usd",
    options: [
      { value: "usd", label: "USD" },
      { value: "eur", label: "EUR" },
      { value: "gbp", label: "GBP" },
    ],
  },
  cartHoldTtlSeconds: {
    type: "number",
    label: "Cart hold TTL",
    description: "Seconds to reserve cart inventory while Checkout is pending.",
    default: CART_HOLD_TTL_SECONDS,
    min: 60,
    max: CART_HOLD_TTL_SECONDS,
  },
  orderTypes: {
    type: "select",
    label: "Enabled order types",
    default: "pickup,delivery",
    options: [
      { value: "pickup", label: "Pickup only" },
      { value: "delivery", label: "Delivery only" },
      { value: "pickup,delivery", label: "Pickup and delivery" },
    ],
  },
  pickupLeadMinutes: {
    type: "number",
    label: "Pickup lead time",
    default: 20,
    min: 0,
  },
  deliveryLeadMinutes: {
    type: "number",
    label: "Delivery lead time",
    default: 45,
    min: 0,
  },
  taxMode: {
    type: "select",
    label: "Tax mode",
    default: "none",
    options: [
      { value: "none", label: "No tax calculation" },
      { value: "stripeTax", label: "Stripe Tax" },
      { value: "manualVat", label: "Manual VAT percentage" },
    ],
  },
  manualVatPercent: {
    type: "number",
    label: "Manual VAT percentage",
    default: 0,
    min: 0,
    max: 100,
  },
} satisfies Record<string, SettingFieldWithSecretMarker>;

export const createOrderLineItemSnapshot = (
  source: SourceOrderLineItem,
): OrderLineItemSnapshot => ({
  menuItemId: source.menuItemId,
  itemName: source.itemName,
  unitPrice: source.unitPrice,
  quantity: source.quantity,
  modifiers: source.modifiers.map((modifier) => ({
    modifierId: modifier.modifierId,
    modifierName: modifier.modifierName,
    priceDelta: modifier.priceDelta,
  })),
});

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write", "email:send", "network:request"],
    allowedHosts: ["api.stripe.com", "checkout.stripe.com"],
    storage: {
      carte_orders: {
        indexes: ["status", "orderType", "email", "createdAt", "stripeCheckoutSessionId"],
        uniqueIndexes: ["orderNumber", "stripeCheckoutSessionId"],
      },
    },
    hooks: {},
    routes: {
      admin: { handler: stubRoute("admin") },
      checkout: { handler: checkoutRoute, public: true },
      "webhook-stripe": { handler: stubRoute("webhook-stripe"), public: true },
      refund: { handler: stubRoute("refund") },
    },
    admin: {
      settingsSchema,
      pages: [{ path: "/carte-orders", label: "Orders", icon: "receipt" }],
    },
  });

export default factory;
