import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});

const tenderChargeMock = vi.hoisted(() => vi.fn());
const tenderRefundMock = vi.hoisted(() => vi.fn());
const tenderGetTransactionMock = vi.hoisted(() => vi.fn());
const createTenderClientFromContextMock = vi.hoisted(() =>
  vi.fn(() => ({
    charge: tenderChargeMock,
    refund: tenderRefundMock,
    getTransaction: tenderGetTransactionMock,
  })),
);

vi.mock("@tenderpay/sdk", () => ({
  createTenderClientFromContext: createTenderClientFromContextMock,
}));

import { adminRoute } from "./routes/admin.js";
import { checkoutRoute } from "./routes/checkout.js";
import { refundRoute } from "./routes/refund.js";
import {
  rateLimitContext,
  spoofableRateLimitContext,
  tenderCheckoutContext,
  tenderRefundContext,
  type RateLimitCounters,
} from "./test-support.js";
import { enforceRateLimit, rateLimitResponse } from "./rate-limit.js";
import type { RouteContext } from "emdash";

const TENDER_CHECKOUT_URL =
  "https://restaurant.example/_emdash/api/plugins/tender-core/checkout/txn_123";

const expectNoForbiddenBlockKitFields = (value: unknown): void => {
  if (!value || typeof value !== "object") return;
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
    if (Array.isArray(child)) child.forEach(expectNoForbiddenBlockKitFields);
    else expectNoForbiddenBlockKitFields(child);
  }
};

const rateLimitedCheckout = async (ctx: RouteContext): Promise<unknown> => {
  const limit = await enforceRateLimit(ctx, "checkout");
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  return checkoutRoute(ctx);
};

const callRateLimited = async (ctx: RouteContext): Promise<unknown> => {
  try {
    return await rateLimitedCheckout(ctx);
  } catch (error) {
    return error;
  }
};

describe("@carte/orders-backend checkout route", () => {
  it("creates hosted Tender charges and stores cart holds for 600 seconds", async () => {
    const { ctx, kvWrites, subrequests } = tenderCheckoutContext();
    tenderChargeMock.mockResolvedValueOnce({
      transactionId: "txn_123",
      status: "requires-action",
      checkoutUrl: TENDER_CHECKOUT_URL,
    });

    const result = await checkoutRoute(ctx);

    expect(result).toEqual({ checkoutUrl: TENDER_CHECKOUT_URL, transactionId: "txn_123" });
    expect(createTenderClientFromContextMock).toHaveBeenCalledWith(ctx, {
      tenderBaseUrl: "https://restaurant.example",
      tenderPluginToken: "tender_plugin_token",
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
    expect(kvWrites).toContainEqual({ key: "cart-hold:cart_123", options: { expirationTtl: 600 } });
    // With the Tender SDK mocked, charge() does not exercise ctx.http.fetch, so
    // the only in-route subrequest is the cart-hold KV write.
    expect(subrequests).toEqual(["kv.set"]);
  });
});

describe("@carte/orders-backend refund route", () => {
  it("refunds paid orders through Tender with mapped reason text", async () => {
    const { ctx, updates, waitUntilTasks } = tenderRefundContext();
    tenderRefundMock.mockResolvedValueOnce({
      refundId: "rf_123",
      transactionId: "txn_123",
      status: "succeeded",
      providerRefundId: "re_123",
    });

    await expect(refundRoute(ctx)).resolves.toEqual({
      ok: true,
      refundId: "rf_123",
      status: "succeeded",
    });
    await Promise.all(waitUntilTasks);

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

  it("omits Tender refund amount for full refunds", async () => {
    const { ctx, updates, waitUntilTasks } = tenderRefundContext({
      input: {
        orderId: "order_full",
        transactionId: "txn_full",
        reason: "Operator requested full refund",
      },
    });
    tenderRefundMock.mockResolvedValueOnce({
      refundId: "rf_full",
      transactionId: "txn_full",
      status: "succeeded",
    });

    await expect(refundRoute(ctx)).resolves.toMatchObject({ ok: true, refundId: "rf_full" });
    await Promise.all(waitUntilTasks);

    const fullRefundRequest = tenderRefundMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(fullRefundRequest).not.toHaveProperty("amount");
    expect(updates[0]?.value).toMatchObject({
      refund: expect.not.objectContaining({ amount: expect.any(Number) }),
    });
  });

  it("forwards explicit zero Tender refund amounts", async () => {
    const { ctx, waitUntilTasks } = tenderRefundContext({
      input: { orderId: "order_zero", transactionId: "txn_zero", amount: 0 },
    });
    tenderRefundMock.mockResolvedValueOnce({
      refundId: "rf_zero",
      transactionId: "txn_zero",
      status: "succeeded",
    });

    await expect(refundRoute(ctx)).resolves.toMatchObject({ ok: true, refundId: "rf_zero" });
    await Promise.all(waitUntilTasks);

    expect(tenderRefundMock.mock.calls.at(-1)?.[0]).toMatchObject({
      transactionId: "txn_zero",
      amount: 0,
      idempotencyKey: "refund-order_zero",
    });
  });

  it("logs an audit record when post-refund content store update fails", async () => {
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
      await expect(refundRoute(ctx)).resolves.toEqual({
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
      | { orderId?: string; refundId?: string }
      | undefined;
    expect(payload).toMatchObject({ orderId: "order_456", refundId: "re_456" });
  });

  it("rejects refund callers without admin scope before external side effects", async () => {
    const { ctx } = tenderRefundContext();
    const scopedCtx = { ...ctx, auth: { scopes: ["content:read"] } } as RouteContext;

    await expect(refundRoute(scopedCtx)).rejects.toThrow("Refund route requires admin scope.");
    expect(tenderRefundMock).not.toHaveBeenCalled();
  });
});

describe("@carte/orders-backend admin route", () => {
  it("returns canonical Block Kit JSON for the read-only orders admin page", async () => {
    const page = await adminRoute({} as RouteContext);

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
    for (let index = 0; index < 100; index += 1) responses.push(await callRateLimited(ctx));

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
    expect(responses[60]).toBeInstanceOf(Response);
    expect((responses[60] as Response).status).toBe(429);
    expect(counters.get).toBe(100);
    expect(counters.set).toBe(60);
  });

  it("writes rate-limit counters with a TTL covering the 60s window", async () => {
    const counters: RateLimitCounters = { get: 0, set: 0, setOptions: [] };
    const ctx = rateLimitContext("203.0.113.22", counters);

    await callRateLimited(ctx);

    expect(counters.set).toBe(1);
    expect(counters.setOptions[0]).toMatchObject({ expirationTtl: 120 });
  });

  it("does not let spoofed x-forwarded-for bypass rate limit when ip is null", async () => {
    const store = new Map<string, unknown>();

    const responses = [];
    for (let index = 0; index < 100; index += 1) {
      responses.push(await callRateLimited(spoofableRateLimitContext(store, `10.0.0.${index}`)));
    }

    const throttled = responses.filter(
      (response) => response instanceof Response && response.status === 429,
    );
    expect(throttled.length).toBeGreaterThan(0);
  });
});
