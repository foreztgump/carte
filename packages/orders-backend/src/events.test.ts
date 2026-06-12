import { describe, expect, it } from "vitest";

import {
  applyTenderTransaction,
  TENDER_TRANSACTION_PROCESSED_VALUE,
  type OrderTransitionContext,
  type TenderTransactionEvent,
} from "./events.js";

const TENDER_TRANSACTION_TTL_SECONDS = 604_800;
const TENDER_TRANSACTION_IN_PROGRESS_TTL_SECONDS = 300;

interface RecordedKvWrite {
  key: string;
  value: unknown;
  options?: { expirationTtl: number };
}

interface RecordedUpdate {
  collection: string;
  id: string;
  value: unknown;
}

const transitionContext = () => {
  const store = new Map<string, unknown>();
  const kvWrites: RecordedKvWrite[] = [];
  const updates: RecordedUpdate[] = [];
  const ctx: OrderTransitionContext = {
    kv: {
      async get<T = unknown>(key: string): Promise<T | null> {
        return (store.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown, options?: { expirationTtl: number }): Promise<void> {
        store.set(key, value);
        kvWrites.push(options === undefined ? { key, value } : { key, value, options });
      },
    },
    content: {
      async update(collection: string, id: string, value: unknown): Promise<void> {
        updates.push({ collection, id, value });
      },
    },
  };
  return { ctx, kvWrites, updates };
};

const paidEvent: TenderTransactionEvent = {
  transactionId: "txn_paid_123",
  orderId: "order_123",
  trigger: "paid",
};

describe("applyTenderTransaction idempotent seam", () => {
  it("marks an order paid exactly once for a redelivered transaction id", async () => {
    const { ctx, kvWrites, updates } = transitionContext();

    const first = await applyTenderTransaction(ctx, paidEvent);
    const second = await applyTenderTransaction(ctx, paidEvent);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(updates).toEqual([
      {
        collection: "carte_orders",
        id: "order_123",
        value: {
          status: "paid",
          payment: { tenderTransactionId: "txn_paid_123", paidAt: expect.any(String) },
        },
      },
    ]);
    expect(kvWrites[0]).toMatchObject({
      key: "idempotency:tender:txn_paid_123:paid",
      value: expect.stringMatching(/^in-progress:/),
      options: { expirationTtl: TENDER_TRANSACTION_IN_PROGRESS_TTL_SECONDS },
    });
    expect(kvWrites[1]).toEqual({
      key: "idempotency:tender:txn_paid_123:paid",
      value: TENDER_TRANSACTION_PROCESSED_VALUE,
      options: { expirationTtl: TENDER_TRANSACTION_TTL_SECONDS },
    });
  });

  it("progresses paid then refunded for the same transaction id", async () => {
    const { ctx, updates } = transitionContext();

    await applyTenderTransaction(ctx, paidEvent);
    const refunded = await applyTenderTransaction(ctx, {
      transactionId: "txn_paid_123",
      orderId: "order_123",
      trigger: "refunded",
    });

    expect(refunded).toBe(true);
    expect(updates.map((update) => update.value)).toEqual([
      {
        status: "paid",
        payment: { tenderTransactionId: "txn_paid_123", paidAt: expect.any(String) },
      },
      {
        status: "refunded",
        refund: { tenderTransactionId: "txn_paid_123", refundedAt: expect.any(String) },
      },
    ]);
  });

  it("treats redelivered refunded events as a no-op", async () => {
    const { ctx, updates } = transitionContext();
    const refundEvent: TenderTransactionEvent = {
      transactionId: "txn_refund_456",
      orderId: "order_456",
      trigger: "refunded",
    };

    await applyTenderTransaction(ctx, refundEvent);
    const duplicate = await applyTenderTransaction(ctx, refundEvent);

    expect(duplicate).toBe(false);
    expect(updates).toHaveLength(1);
  });

  it("applies exactly one transition for concurrent duplicate deliveries", async () => {
    const { ctx, updates } = transitionContext();

    const [first, second] = await Promise.all([
      applyTenderTransaction(ctx, paidEvent),
      applyTenderTransaction(ctx, paidEvent),
    ]);

    expect([first, second].filter(Boolean)).toHaveLength(1);
    expect(updates).toHaveLength(1);
  });
});
