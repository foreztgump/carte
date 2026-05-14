const TENDER_EVENT_IDEMPOTENCY_TTL_SECONDS = 604_800;
const TENDER_EVENT_IDEMPOTENCY_PREFIX = "idempotency:tender:";
const ORDER_STATUS_PAID = "paid";
const ORDER_STATUS_REFUNDED = "refunded";

export const TENDER_EVENT_PROCESSED_VALUE = "processed";

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

export const markOrderPaid = async (
  ctx: unknown,
  orderId: string,
  eventId: string,
): Promise<void> => {
  await eventContentStore(ctx).update("carte_orders", orderId, {
    status: ORDER_STATUS_PAID,
    payment: { tenderEventId: eventId, paidAt: new Date().toISOString() },
  });
};

export const markOrderRefunded = async (
  ctx: unknown,
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
  ctx: unknown,
): Promise<void> => {
  const prepared = await prepareTenderPaymentEvent(event, ctx);
  if (prepared === null) return;

  eventContext(ctx).waitUntil(markOrderPaid(ctx, prepared.orderId, prepared.eventId));
};

export const tenderPaymentRefundedHook = async (
  event: TenderPaymentEvent,
  ctx: unknown,
): Promise<void> => {
  const prepared = await prepareTenderPaymentEvent(event, ctx);
  if (prepared === null) return;

  eventContext(ctx).waitUntil(markOrderRefunded(ctx, prepared.orderId, prepared.eventId));
};

const prepareTenderPaymentEvent = async (
  event: TenderPaymentEvent,
  ctx: unknown,
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

const eventKvStore = (ctx: unknown): TenderEventContext["kv"] => eventContext(ctx).kv;

const eventContentStore = (ctx: unknown): TenderEventContext["content"] =>
  eventContext(ctx).content;

const eventContext = (ctx: unknown): TenderEventContext => ctx as TenderEventContext;
