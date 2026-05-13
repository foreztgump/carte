import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RouteContext } from "emdash";

const tenderChargeMock = vi.hoisted(() => vi.fn());
const tenderRefundMock = vi.hoisted(() => vi.fn());
const createTenderClientMock = vi.hoisted(() =>
  vi.fn(() => ({
    charge: tenderChargeMock,
    refund: tenderRefundMock,
  })),
);

vi.mock("@tender/sdk", () => ({
  createTenderClient: createTenderClientMock,
}));

import factory, { TENDER_EVENT_PROCESSED_VALUE } from "./index.js";

const CANONICAL_CAPABILITIES = new Set([
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "network:request",
  "email:send",
  "users:read",
]);

const expectNoForbiddenBlockKitFields = (value: unknown): void => {
  if (!value || typeof value !== "object") {
    return;
  }
  const record = value as Record<string, unknown>;
  expect(record).not.toHaveProperty("stats");
  expect(record.type).not.toBe("redirect");
  if (record.type === "button") {
    expect(record).toHaveProperty("label");
    expect(record).not.toHaveProperty("text");
  }
  if (record.type === "section") {
    expect(record.text).toEqual(expect.not.stringMatching(/(\*\*|\[[^\]]+\])/));
  }
  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      child.forEach(expectNoForbiddenBlockKitFields);
    } else {
      expectNoForbiddenBlockKitFields(child);
    }
  }
};

type RateLimitCounters = {
  get: number;
  set: number;
  setOptions: Array<Record<string, unknown> | undefined>;
};

const TENDER_CHECKOUT_URL =
  "https://restaurant.example/_emdash/api/plugins/tender-core/checkout/txn_123";
const TENDER_EVENT_TTL_SECONDS = 604_800;

const tenderCheckoutContext = () => {
  const subrequests: string[] = [];
  const kvWrites: Array<{ key: string; options?: { expirationTtl: number } }> = [];
  const ctx = {
    input: tenderCheckoutInput(),
    request: new Request("https://example.test/checkout"),
    requestMeta: { ip: "203.0.113.44", userAgent: null, referer: null, geo: null },
    kv: {
      async get() {
        subrequests.push("kv.get");
        return null;
      },
      async set(key: string, _value: unknown, options?: { expirationTtl: number }) {
        subrequests.push("kv.set");
        if (options) kvWrites.push({ key, options });
      },
    },
    http: {
      async fetch(url: string, init: RequestInit) {
        subrequests.push("http.fetch");
        return new Response(JSON.stringify({ url, init }));
      },
    },
    settings: {
      tenderBaseUrl: "https://restaurant.example",
      tenderPluginToken: "tender_plugin_token",
      currency: "usd",
    },
  } as unknown as RouteContext;
  return { ctx, kvWrites, subrequests };
};

const tenderCheckoutInput = () => ({
  cartId: "cart_123",
  orderId: "order_123",
  customerEmail: "guest@example.com",
  successUrl: "https://restaurant.example/orders/success",
  cancelUrl: "https://restaurant.example/orders/cancel",
  lineItems: [{ name: "Margherita Pizza", unitAmount: 1295, quantity: 2 }],
});

interface TenderRefundContextOptions {
  input?: {
    orderId: string;
    transactionId: string;
    amount?: number;
    reason?: string;
  };
  update?: (collection: string, id: string, value: unknown) => Promise<void>;
}

const tenderRefundContext = (options: TenderRefundContextOptions = {}) => {
  const updates: Array<{ collection: string; id: string; value: unknown }> = [];
  const waitUntilTasks: Promise<unknown>[] = [];
  const ctx = {
    input: options.input ?? {
      orderId: "order_123",
      transactionId: "txn_123",
      amount: 1295,
      reason: "Customer changed their mind",
    },
    auth: { scopes: ["admin"] },
    http: {
      async fetch() {
        throw new Error("Refund route must use Tender SDK instead of direct fetch.");
      },
    },
    content: {
      async update(collection: string, id: string, value: unknown) {
        if (options.update) return options.update(collection, id, value);
        updates.push({ collection, id, value });
      },
    },
    settings: {
      tenderBaseUrl: "https://restaurant.example",
      tenderPluginToken: "tender_plugin_token",
    },
    waitUntil(task: Promise<unknown>) {
      waitUntilTasks.push(task);
    },
  } as unknown as RouteContext;

  return { ctx, updates, waitUntilTasks };
};

const expectTenderCheckoutCharge = (): void => {
  expect(createTenderClientMock).toHaveBeenCalledWith({
    baseUrl: "https://restaurant.example",
    pluginToken: "tender_plugin_token",
    fetch: expect.any(Function),
  });
  expect(tenderChargeMock).toHaveBeenCalledWith({
    flow: "hosted",
    amount: 2590,
    currency: "usd",
    customerEmail: "guest@example.com",
    returnUrl: "https://restaurant.example/orders/success",
    cancelUrl: "https://restaurant.example/orders/cancel",
    description: "Margherita Pizza x2",
    metadata: { carte_order_id: "order_123", carte_cart_id: "cart_123" },
    originatingPluginId: "carte-orders-backend",
  });
};

const expectCheckoutKvTtls = (
  kvWrites: Array<{ key: string; options?: { expirationTtl: number } }>,
): void => {
  expect(kvWrites).toContainEqual({
    key: "cart-hold:cart_123",
    options: { expirationTtl: 600 },
  });
  expect(kvWrites).toContainEqual({
    key: "rate-limit:checkout:203.0.113.44",
    options: { expirationTtl: 120 },
  });
};

const rateLimitContext = (ip: string | null, counters: RateLimitCounters): RouteContext => {
  const store = new Map<string, unknown>();
  return {
    input: {},
    request: new Request("https://example.test/checkout"),
    requestMeta: { ip, userAgent: null, referer: null, geo: null },
    kv: {
      async get<T>(key: string): Promise<T | null> {
        counters.get += 1;
        return (store.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown, options?: Record<string, unknown>): Promise<void> {
        counters.set += 1;
        counters.setOptions.push(options);
        store.set(key, value);
      },
    },
  } as unknown as RouteContext;
};

const checkoutHandler = () => {
  const handler = factory().routes.checkout?.handler;
  if (handler === undefined) throw new Error("checkout route missing");
  return handler;
};

const tenderEventContext = () => {
  const seenEvents = new Set<string>();
  const updates: Array<{ collection: string; id: string; value: unknown }> = [];
  const waitUntilTasks: Promise<unknown>[] = [];
  const kvWrites: Array<{ key: string; value: unknown; options?: { expirationTtl: number } }> = [];
  const ctx = {
    kv: {
      async get(key: string) {
        return seenEvents.has(key) ? TENDER_EVENT_PROCESSED_VALUE : null;
      },
      async set(key: string, value: unknown, options?: { expirationTtl: number }) {
        seenEvents.add(key);
        if (options === undefined) kvWrites.push({ key, value });
        else kvWrites.push({ key, value, options });
      },
    },
    content: {
      async update(collection: string, id: string, value: unknown) {
        updates.push({ collection, id, value });
      },
    },
    waitUntil(task: Promise<unknown>) {
      waitUntilTasks.push(task);
    },
  } as unknown as RouteContext;

  return { ctx, kvWrites, updates, waitUntilTasks };
};

const callCheckout = async (ctx: RouteContext): Promise<unknown> => {
  try {
    return await checkoutHandler()(ctx);
  } catch (error) {
    return error;
  }
};

describe("@carte/orders-backend manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-orders-backend");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names and keeps Stripe hosts out of the allowlist", () => {
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
    expect(manifest.allowedHosts).toEqual(["license.carteplugin.dev"]);
    expect(manifest.allowedHosts).not.toContain("api.stripe.com");
    expect(manifest.allowedHosts).not.toContain("checkout.stripe.com");
    expect(manifest.capabilities).not.toContain("network:request:unrestricted");
  });

  it("does not register the legacy Stripe webhook route", () => {
    const manifest = factory();
    const legacyStripeWebhookRoute = ["webhook", "stripe"].join("-");

    expect(manifest.routes).not.toHaveProperty(legacyStripeWebhookRoute);
  });

  it("declares placeholder Tender payment hooks for EmDash 0.10 namespace dispatch", () => {
    const manifest = factory();
    const hooks = manifest.hooks as Record<string, unknown>;

    expect(hooks).toHaveProperty("tender:payment.succeeded");
    expect(hooks).toHaveProperty("tender:payment.refunded");
  });

  it("declares Tender and order settings without legacy Stripe secrets", () => {
    const manifest = factory();
    const settings = manifest.admin.settingsSchema as Record<string, { options?: unknown }>;

    expect(settings).toMatchObject({
      tenderBaseUrl: { type: "string" },
      tenderPluginToken: { type: "secret", secret: true },
      tenderProvider: { type: "select", default: "stripe" },
      currency: { type: "select", default: "usd" },
      cartHoldTtlSeconds: { type: "number", default: 600 },
      orderTypes: { type: "select", default: "pickup,delivery" },
      pickupLeadMinutes: { type: "number" },
      deliveryLeadMinutes: { type: "number" },
      taxMode: { type: "select" },
      manualVatPercent: { type: "number" },
    });
    expect(settings).not.toHaveProperty("stripePublicKey");
    expect(settings).not.toHaveProperty("stripeSecretKey");
    expect(settings).not.toHaveProperty("stripeWebhookSecret");
    expect(settings.tenderProvider?.options).toEqual([
      { value: "stripe", label: "Stripe via Tender" },
    ]);
  });

  it("shows the stale Stripe secret migration warning exactly once without leaking the key", async () => {
    const { createStaleStripeSettingsWarning } = await import("./index.js");
    const writes: Array<{ key: string; value: unknown; options?: Record<string, unknown> }> = [];
    const seenKeys = new Set<string>();
    const ctx = {
      settings: { stripeSecretKey: "sk_live_should_never_leak" },
      kv: {
        async get(key: string) {
          return seenKeys.has(key) ? "shown" : null;
        },
        async set(key: string, value: unknown, options?: Record<string, unknown>) {
          seenKeys.add(key);
          if (options === undefined) {
            writes.push({ key, value });
            return;
          }
          writes.push({ key, value, options });
        },
      },
    } as unknown as RouteContext;

    const firstWarning = await createStaleStripeSettingsWarning(ctx);
    const secondWarning = await createStaleStripeSettingsWarning(ctx);

    expect(firstWarning).toMatchObject({
      type: "section",
      label: "Tender migration notice",
      text: expect.stringContaining("Move the legacy Stripe secret to @tender/stripe settings"),
    });
    expect(secondWarning).toBeNull();
    expect(writes).toEqual([
      {
        key: "migration:stripe-secret-warning-shown",
        value: "shown",
        options: { expirationTtl: 31_536_000 },
      },
    ]);
    expect(JSON.stringify(firstWarning)).not.toContain("sk_live_should_never_leak");
    expectNoForbiddenBlockKitFields(firstWarning);
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

  it("returns canonical Block Kit JSON for the read-only orders admin page", async () => {
    const manifest = factory();
    const adminRoute = manifest.routes.admin;
    expect(adminRoute).toBeDefined();

    const page = await adminRoute?.handler({} as RouteContext);

    expect(page).toMatchObject({
      type: "page",
      title: "Carte Orders",
      blocks: expect.arrayContaining([
        expect.objectContaining({ type: "section", label: "Orders summary" }),
        expect.objectContaining({ type: "stats", label: "Order pipeline" }),
      ]),
    });
    expectNoForbiddenBlockKitFields(page);
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

  it("creates hosted Tender charges and stores cart holds for 600 seconds", async () => {
    const manifest = factory();
    const { ctx, kvWrites, subrequests } = tenderCheckoutContext();
    tenderChargeMock.mockResolvedValueOnce({
      transactionId: "txn_123",
      status: "requires-action",
      checkoutUrl: TENDER_CHECKOUT_URL,
    });

    const checkoutRoute = manifest.routes.checkout;
    expect(checkoutRoute).toBeDefined();

    const checkoutResult = await checkoutRoute?.handler(ctx);

    expect(checkoutResult).toEqual({ checkoutUrl: TENDER_CHECKOUT_URL });
    expectTenderCheckoutCharge();
    expectCheckoutKvTtls(kvWrites);
    expect(subrequests).toHaveLength(3);
  });

  it("refunds paid orders through Tender with mapped reason text", async () => {
    const manifest = factory();
    const { ctx, updates, waitUntilTasks } = tenderRefundContext();
    tenderRefundMock.mockResolvedValueOnce({
      refundId: "rf_123",
      transactionId: "txn_123",
      status: "succeeded",
      providerRefundId: "re_123",
    });

    await expect(manifest.routes.refund?.handler(ctx)).resolves.toEqual({
      ok: true,
      refundId: "rf_123",
      status: "succeeded",
    });
    await Promise.all(waitUntilTasks);

    expect(createTenderClientMock).toHaveBeenCalledWith({
      baseUrl: "https://restaurant.example",
      pluginToken: "tender_plugin_token",
      fetch: expect.any(Function),
    });
    expect(tenderRefundMock).toHaveBeenCalledWith({
      transactionId: "txn_123",
      amount: 1295,
      reason: "requested-by-customer",
      reasonNote: "Customer changed their mind",
      idempotencyKey: "refund-order_123",
    });
    expect(updates).toEqual([
      {
        collection: "carte_orders",
        id: "order_123",
        value: {
          status: "refunded",
          refund: {
            id: "rf_123",
            transactionId: "txn_123",
            amount: 1295,
            status: "succeeded",
            createdAt: expect.any(String),
          },
        },
      },
    ]);
  });

  it("logs an audit record when post-refund content store update fails", async () => {
    const manifest = factory();
    const errorLog: unknown[][] = [];
    const originalConsoleError = console.error;
    const { ctx, waitUntilTasks } = tenderRefundContext({
      input: { orderId: "order_456", transactionId: "txn_456" },
      update: async () => {
        throw new Error("Content store unavailable.");
      },
    });
    tenderRefundMock.mockResolvedValueOnce({
      refundId: "re_456",
      transactionId: "txn_456",
      status: "succeeded",
      providerRefundId: "re_provider_456",
    });
    console.error = (...args: unknown[]) => {
      errorLog.push(args);
    };

    try {
      await expect(manifest.routes.refund?.handler(ctx)).resolves.toEqual({
        ok: true,
        refundId: "re_456",
        status: "succeeded",
      });
      await Promise.all(waitUntilTasks);
    } finally {
      console.error = originalConsoleError;
    }

    const auditEntry = errorLog.find((entry) =>
      entry.some(
        (value) =>
          typeof value === "string" && value.includes("[carte-orders-backend][refund-reconcile]"),
      ),
    );
    expect(auditEntry).toBeDefined();
    const payload = auditEntry?.find((value) => typeof value === "object" && value !== null) as
      | { orderId?: string; refundId?: string; reason?: string }
      | undefined;
    expect(payload).toMatchObject({
      orderId: "order_456",
      refundId: "re_456",
    });
  });

  it("rejects refund callers without admin scope before external side effects", async () => {
    const manifest = factory();
    const sideEffects: string[] = [];
    const ctx = {
      input: { orderId: "order_123", transactionId: "txn_123" },
      auth: { scopes: ["content:read"] },
      http: {
        async fetch() {
          sideEffects.push("http.fetch");
          return new Response("{}");
        },
      },
      content: {
        async update() {
          sideEffects.push("content.update");
        },
      },
      settings: { stripeSecretKey: "sk_test_orders" },
    } as unknown as RouteContext;

    await expect(manifest.routes.refund?.handler(ctx)).rejects.toThrow(
      "Refund route requires admin scope.",
    );
    expect(sideEffects).toEqual([]);
  });

  it("exports a Tender payment-succeeded hook that idempotently marks orders paid", async () => {
    const { tenderPaymentSucceededHook } = await import("./index.js");
    const event = {
      id: "evt_tender_paid_123",
      metadata: { carte_order_id: "order_123" },
    };
    const { ctx, kvWrites, updates, waitUntilTasks } = tenderEventContext();

    await tenderPaymentSucceededHook(event, ctx);
    await tenderPaymentSucceededHook(event, ctx);
    await Promise.all(waitUntilTasks);

    expect(kvWrites).toEqual([
      {
        key: "idempotency:tender:evt_tender_paid_123",
        value: TENDER_EVENT_PROCESSED_VALUE,
        options: { expirationTtl: TENDER_EVENT_TTL_SECONDS },
      },
    ]);
    expect(waitUntilTasks).toHaveLength(1);
    expect(updates).toEqual([
      {
        collection: "carte_orders",
        id: "order_123",
        value: {
          status: "paid",
          payment: {
            tenderEventId: "evt_tender_paid_123",
            paidAt: expect.any(String),
          },
        },
      },
    ]);
  });

  it("exports a Tender payment-refunded hook that ignores events without Carte metadata", async () => {
    const { tenderPaymentRefundedHook } = await import("./index.js");
    const { ctx, kvWrites, updates, waitUntilTasks } = tenderEventContext();

    await tenderPaymentRefundedHook({ id: "evt_without_order", metadata: {} }, ctx);

    expect(kvWrites).toEqual([]);
    expect(waitUntilTasks).toEqual([]);
    expect(updates).toEqual([]);
  });
});

describe("@carte/orders-backend checkout rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttles burst traffic from one IP inside a 60 second window", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = rateLimitContext("203.0.113.20", counters);

    const responses = [];
    for (let index = 0; index < 100; index += 1) responses.push(await callCheckout(ctx));

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
    expect(responses[60]).toBeInstanceOf(Response);
    expect((responses[60] as Response).status).toBe(429);
    expect(counters.get).toBe(100);
    expect(counters.set).toBe(60);
  });

  it("allows legitimate one request per second traffic", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = rateLimitContext("203.0.113.21", counters);

    const responses = [];
    for (let index = 0; index < 100; index += 1) {
      vi.setSystemTime(new Date(Date.UTC(2026, 4, 8, 12, 0, index)));
      responses.push(await callCheckout(ctx));
    }

    expect(responses.every((response) => !(response instanceof Response))).toBe(true);
    expect(counters.get).toBe(100);
    expect(counters.set).toBe(100);
  });

  it("writes rate-limit counters with a TTL covering the 60s window", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = rateLimitContext("203.0.113.22", counters);

    await callCheckout(ctx);

    expect(counters.set).toBe(1);
    expect(counters.setOptions[0]).toMatchObject({ expirationTtl: 120 });
  });

  it("does not let spoofed x-forwarded-for bypass rate limit when ip is null", async () => {
    const baseStore = new Map<string, unknown>();
    const sharedKv = {
      async get<T>(key: string): Promise<T | null> {
        return (baseStore.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown): Promise<void> {
        baseStore.set(key, value);
      },
    };
    const buildCtx = (xff: string): RouteContext =>
      ({
        input: {},
        request: new Request("https://example.test/checkout", {
          headers: { "x-forwarded-for": xff },
        }),
        requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
        kv: sharedKv,
      }) as unknown as RouteContext;

    const responses = [];
    for (let index = 0; index < 100; index += 1) {
      responses.push(await callCheckout(buildCtx(`10.0.0.${index}`)));
    }

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
  });
});
