// Order state machine seam: pending → paid → refunded.
//
// A single exported trigger, `applyTenderTransaction`, keyed by Tender
// transaction id. Delivering the same transaction-id trigger twice transitions
// the order exactly once (duplicate is a no-op; at-least-once safe). There is
// NO delivery mechanism here — no webhook, polling, or event bus. Consumption
// is deferred to PRO-859/WS4. All work completes in-request: the sandbox has no
// post-response primitive (VERIFIED-PLATFORM-0.18-carte §7 — no ctx.waitUntil,
// no after()).

const ORDERS_COLLECTION = "carte_orders";
const TRANSACTION_TTL_SECONDS = 604_800;
const IN_PROGRESS_TTL_SECONDS = 300;
const IDEMPOTENCY_PREFIX = "idempotency:tender:";
const IN_PROGRESS_PREFIX = "in-progress:";

export const TENDER_TRANSACTION_PROCESSED_VALUE = "processed";

export type OrderTrigger = "paid" | "refunded";

export interface TenderTransactionEvent {
  transactionId: string;
  orderId: string;
  trigger: OrderTrigger;
}

export interface OrderTransitionContext {
  kv: {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: unknown, options?: { expirationTtl: number }): Promise<void>;
  };
  content: {
    update(collection: string, id: string, value: unknown): Promise<void>;
  };
}

/**
 * Idempotently transition an order for a Tender transaction trigger. Returns
 * true when this call performed the transition, false when it was a duplicate
 * no-op. A write-then-verify KV marker narrows the concurrent-redelivery race:
 * the order content update only runs once the caller owns the marker.
 */
export const applyTenderTransaction = async (
  ctx: OrderTransitionContext,
  event: TenderTransactionEvent,
): Promise<boolean> => {
  const key = idempotencyKey(event);
  if ((await ctx.kv.get(key)) !== null) return false;

  const marker = `${IN_PROGRESS_PREFIX}${createWriterId()}`;
  await ctx.kv.set(key, marker, { expirationTtl: IN_PROGRESS_TTL_SECONDS });
  if ((await ctx.kv.get<string>(key)) !== marker) return false;

  await transitionOrder(ctx, event);
  await ctx.kv.set(key, TENDER_TRANSACTION_PROCESSED_VALUE, {
    expirationTtl: TRANSACTION_TTL_SECONDS,
  });
  return true;
};

const transitionOrder = (
  ctx: OrderTransitionContext,
  event: TenderTransactionEvent,
): Promise<void> => ctx.content.update(ORDERS_COLLECTION, event.orderId, transitionValue(event));

const transitionValue = (event: TenderTransactionEvent): Record<string, unknown> =>
  event.trigger === "paid"
    ? { status: "paid", payment: { tenderTransactionId: event.transactionId, paidAt: now() } }
    : {
        status: "refunded",
        refund: { tenderTransactionId: event.transactionId, refundedAt: now() },
      };

const idempotencyKey = (event: TenderTransactionEvent): string =>
  `${IDEMPOTENCY_PREFIX}${event.transactionId}:${event.trigger}`;

const createWriterId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const now = (): string => new Date().toISOString();
