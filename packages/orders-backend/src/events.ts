const TENDER_EVENT_IDEMPOTENCY_TTL_SECONDS = 604_800;
const TENDER_EVENT_IN_PROGRESS_TTL_SECONDS = 300;
const TENDER_EVENT_IDEMPOTENCY_PREFIX = "idempotency:tender:";
const TENDER_EVENT_IN_PROGRESS_PREFIX = "in-progress:";
const TENDER_EVENT_RECONCILE_LOG_PREFIX = "[carte-orders-backend][tender-event-reconcile]";
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
// directly. Sandbox budget per handler: worst case is 1 KV get + 1 KV set + 1
// KV verify get + 1 KV processed set + 1 content update inside ctx.waitUntil =
// 5/10 subrequests; already-processed duplicates cost 1/10. Cloudflare KV has
// no strict compare-and-set here, so the write-then-verify marker narrows the
// duplicate-redelivery race to the same residual window accepted by the v0.1
// Stripe webhook. TODO(PRO-727): replace this with EmDash 0.10 first-writer
// dispatch semantics once custom inter-plugin events ship.
export const tenderPaymentSucceededHook = async (
  event: TenderPaymentEvent,
  ctx: unknown,
): Promise<void> => {
  const prepared = await prepareTenderPaymentEvent(event, ctx);
  if (prepared === null) return;

  scheduleTenderPaidEventUpdate(ctx, prepared);
};

export const tenderPaymentRefundedHook = async (
  event: TenderPaymentEvent,
  ctx: unknown,
): Promise<void> => {
  const prepared = await prepareTenderPaymentEvent(event, ctx);
  if (prepared === null) return;

  scheduleTenderRefundedEventUpdate(ctx, prepared);
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

  const inProgressValue = tenderEventInProgressValue(createTenderEventWriterId());
  await kv.set(key, inProgressValue, {
    expirationTtl: TENDER_EVENT_IN_PROGRESS_TTL_SECONDS,
  });
  if ((await kv.get<string>(key)) !== inProgressValue) return null;

  await kv.set(key, TENDER_EVENT_PROCESSED_VALUE, {
    expirationTtl: TENDER_EVENT_IDEMPOTENCY_TTL_SECONDS,
  });
  return { orderId, eventId };
};

const carteOrderId = (event: TenderPaymentEvent): string | null =>
  typeof event.metadata?.carte_order_id === "string" ? event.metadata.carte_order_id : null;

const tenderEventIdempotencyKey = (eventId: string): string =>
  `${TENDER_EVENT_IDEMPOTENCY_PREFIX}${eventId}`;

const tenderEventInProgressValue = (writerId: string): string =>
  `${TENDER_EVENT_IN_PROGRESS_PREFIX}${writerId}`;

const createTenderEventWriterId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const scheduleTenderPaidEventUpdate = (ctx: unknown, event: PreparedTenderPaymentEvent): void => {
  const task = markOrderPaid(ctx, event.orderId, event.eventId).catch((error: unknown) => {
    logTenderEventUpdateFailure(event, ORDER_STATUS_PAID, error);
  });
  eventContext(ctx).waitUntil(task);
};

const scheduleTenderRefundedEventUpdate = (
  ctx: unknown,
  event: PreparedTenderPaymentEvent,
): void => {
  const task = markOrderRefunded(ctx, event.orderId, event.eventId).catch((error: unknown) => {
    logTenderEventUpdateFailure(event, ORDER_STATUS_REFUNDED, error);
  });
  eventContext(ctx).waitUntil(task);
};

const logTenderEventUpdateFailure = (
  event: PreparedTenderPaymentEvent,
  status: typeof ORDER_STATUS_PAID | typeof ORDER_STATUS_REFUNDED,
  error: unknown,
): void => {
  console.error(TENDER_EVENT_RECONCILE_LOG_PREFIX, {
    eventId: event.eventId,
    orderId: event.orderId,
    status,
    error: error instanceof Error ? error.message : String(error),
  });
};

const eventKvStore = (ctx: unknown): TenderEventContext["kv"] => eventContext(ctx).kv;

const eventContentStore = (ctx: unknown): TenderEventContext["content"] =>
  eventContext(ctx).content;

const eventContext = (ctx: unknown): TenderEventContext => ctx as TenderEventContext;
