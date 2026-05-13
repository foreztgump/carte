// @carte/orders-backend — sandboxed EmDash plugin skeleton.
//
// v0.2 scope: Tender hosted-checkout creation and refund reconciliation.
// Tender owns payment-card details and the provider webhook; Carte receives
// only Tender payment references through backend routes and future hooks.
//
// Sandbox budget: each handler must fit inside 50ms CPU + 10 subrequests
// + 30s wall-time + ~128MB memory. Stay within the 10-subrequest budget.

import { definePlugin } from "emdash";

import { enforceRateLimit, rateLimitResponse } from "./rate-limit.js";
import { NETWORK_ALLOWED_HOSTS } from "./manifest-constants.js";
import { adminRoute } from "./routes/admin.js";
import { checkoutRoute } from "./routes/checkout.js";
import { refundRoute } from "./routes/refund.js";

import type { RouteContext } from "emdash";

const PLUGIN_ID = "carte-orders-backend";
const PLUGIN_VERSION = "0.1.0";
const CART_HOLD_TTL_SECONDS = 600;
const STALE_STRIPE_WARNING_KEY = "migration:stripe-secret-warning-shown";
const STALE_STRIPE_WARNING_TTL_SECONDS = 31_536_000;
const TENDER_EVENT_IDEMPOTENCY_TTL_SECONDS = 604_800;
const TENDER_EVENT_IDEMPOTENCY_PREFIX = "idempotency:tender:";
const ORDER_STATUS_PAID = "paid";
const ORDER_STATUS_REFUNDED = "refunded";
export const TENDER_EVENT_PROCESSED_VALUE = "processed";

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

interface RuntimeSettings {
  settings?: {
    stripeSecretKey?: unknown;
  };
}

interface RuntimeKv {
  kv?: {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: unknown, options?: { expirationTtl: number }): Promise<void>;
  };
}

interface TenderPaymentEvent {
  id?: string;
  metadata?: {
    carte_order_id?: unknown;
  };
}

interface TenderEventContext {
  kv: {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: unknown, options?: { expirationTtl: number }): Promise<void>;
  };
  content: {
    update(collection: string, id: string, value: unknown): Promise<void>;
  };
  waitUntil(task: Promise<void>): void;
}

interface PreparedTenderPaymentEvent {
  orderId: string;
  eventId: string;
}

interface BlockKitSection {
  type: "section";
  label: string;
  text: string;
}

interface BlockKitPage {
  type: "page";
  blocks: unknown[];
}

export interface OrderLineItemSnapshot {
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  modifiers: SourceModifierSelection[];
}

const settingsSchema = {
  tenderBaseUrl: {
    type: "string",
    label: "Tender base URL",
    description: "Base URL for the Tender plugin routes, for example https://restaurant.example/.",
  },
  tenderPluginToken: {
    type: "secret",
    label: "Tender plugin token",
    description: "Plugin token issued by Tender for this Carte consumer.",
    secret: true,
  },
  tenderProvider: {
    type: "select",
    label: "Tender provider",
    description: "Payment provider identifier for downstream Tender signalling.",
    default: "stripe",
    options: [{ value: "stripe", label: "Stripe via Tender" }],
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

export const createStaleStripeSettingsWarning = async (
  ctx: RouteContext,
): Promise<BlockKitSection | null> => {
  const runtime = ctx as RouteContext & RuntimeSettings & RuntimeKv;
  const hasLegacySecret = typeof runtime.settings?.stripeSecretKey === "string";
  if (!hasLegacySecret || runtime.kv === undefined) return null;

  try {
    const alreadyShown = await runtime.kv.get<string>(STALE_STRIPE_WARNING_KEY);
    if (alreadyShown === "shown") return null;

    await runtime.kv.set(STALE_STRIPE_WARNING_KEY, "shown", {
      expirationTtl: STALE_STRIPE_WARNING_TTL_SECONDS,
    });
  } catch {
    return null;
  }

  return {
    type: "section",
    label: "Tender migration notice",
    text: "Move the legacy Stripe secret to @tender/stripe settings, then remove it from Carte orders backend settings.",
  };
};

export const markOrderPaid = async (
  ctx: RouteContext,
  orderId: string,
  eventId: string,
): Promise<void> => {
  await eventContentStore(ctx).update("carte_orders", orderId, {
    status: ORDER_STATUS_PAID,
    payment: { tenderEventId: eventId, paidAt: new Date().toISOString() },
  });
};

export const markOrderRefunded = async (
  ctx: RouteContext,
  orderId: string,
  eventId: string,
): Promise<void> => {
  await eventContentStore(ctx).update("carte_orders", orderId, {
    status: ORDER_STATUS_REFUNDED,
    refund: { tenderEventId: eventId, refundedAt: new Date().toISOString() },
  });
};

// PLACEHOLDERS pending EmDash 0.10 custom inter-plugin hook namespace
// dispatch. EmDash 0.9.0 preserves this descriptor shape but does not yet
// dispatch tender:* namespaces, so tests invoke these exported handlers
// directly. Sandbox budget per handler: 1 KV get + 1 KV set + 1 content
// update inside ctx.waitUntil = 3/10 subrequests.
export const tenderPaymentSucceededHook = async (
  event: TenderPaymentEvent,
  ctx: RouteContext,
): Promise<void> => {
  const prepared = await prepareTenderPaymentEvent(event, ctx);
  if (prepared === null) return;

  eventContext(ctx).waitUntil(markOrderPaid(ctx, prepared.orderId, prepared.eventId));
};

export const tenderPaymentRefundedHook = async (
  event: TenderPaymentEvent,
  ctx: RouteContext,
): Promise<void> => {
  const prepared = await prepareTenderPaymentEvent(event, ctx);
  if (prepared === null) return;

  eventContext(ctx).waitUntil(markOrderRefunded(ctx, prepared.orderId, prepared.eventId));
};

const prepareTenderPaymentEvent = async (
  event: TenderPaymentEvent,
  ctx: RouteContext,
): Promise<PreparedTenderPaymentEvent | null> => {
  const orderId = carteOrderId(event);
  const eventId = event.id;
  if (!orderId || !eventId) return null;

  const key = tenderEventIdempotencyKey(eventId);
  const kv = eventKvStore(ctx);
  if ((await kv.get<string>(key)) !== null) return null;

  await kv.set(key, TENDER_EVENT_PROCESSED_VALUE, {
    expirationTtl: TENDER_EVENT_IDEMPOTENCY_TTL_SECONDS,
  });
  return { orderId, eventId };
};

const carteOrderId = (event: TenderPaymentEvent): string | null =>
  typeof event.metadata?.carte_order_id === "string" ? event.metadata.carte_order_id : null;

const tenderEventIdempotencyKey = (eventId: string): string =>
  `${TENDER_EVENT_IDEMPOTENCY_PREFIX}${eventId}`;

const eventKvStore = (ctx: RouteContext): TenderEventContext["kv"] => eventContext(ctx).kv;

const eventContentStore = (ctx: RouteContext): TenderEventContext["content"] =>
  eventContext(ctx).content;

const eventContext = (ctx: RouteContext): TenderEventContext =>
  ctx as RouteContext & TenderEventContext;

const rateLimitedCheckoutRoute = async (ctx: RouteContext): Promise<unknown> => {
  const limit = await enforceRateLimit(ctx, "checkout");
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  return checkoutRoute(ctx);
};

const adminRouteWithMigrationWarning = async (ctx: RouteContext): Promise<unknown> => {
  const [page, warning] = await Promise.all([
    adminRoute(ctx),
    createStaleStripeSettingsWarning(ctx).catch(() => null),
  ]);
  if (warning === null) return page;
  const blockPage = page as BlockKitPage;
  return { ...blockPage, blocks: [warning, ...blockPage.blocks] };
};

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write", "email:send", "network:request"],
    // @tender/sdk calls are routed through EmDash plugin routes, not external
    // hosts; license validation remains the only explicit network allowlist.
    allowedHosts: [...NETWORK_ALLOWED_HOSTS],
    storage: {
      carte_orders: {
        indexes: ["status", "orderType", "email", "createdAt", "stripeCheckoutSessionId"],
        uniqueIndexes: ["orderNumber", "stripeCheckoutSessionId"],
      },
    },
    hooks: {
      "tender:payment.succeeded": tenderPaymentSucceededHook,
      "tender:payment.refunded": tenderPaymentRefundedHook,
    } as never,
    routes: {
      admin: { handler: adminRouteWithMigrationWarning },
      checkout: { handler: rateLimitedCheckoutRoute, public: true },
      refund: { handler: refundRoute },
    },
    admin: {
      settingsSchema,
      pages: [{ path: "/carte-orders", label: "Orders", icon: "receipt" }],
    },
  });

export default factory;
