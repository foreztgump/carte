import type { RouteContext } from "emdash";

// Subrequest audit: 1 Stripe Refund fetch on the request path + 1 content
// update inside ctx.waitUntil = 2/10. Unauthorized callers return before
// external side effects, using 0/10. The content store update runs after
// the Stripe refund succeeds and is wrapped in waitUntil so it cannot
// undo or block the refund response. If the content update fails, an
// audit record is logged so an operator can reconcile the order state
// manually (Stripe is the source of truth for refund settlement).
const STRIPE_REFUNDS_URL = "https://api.stripe.com/v1/refunds";
const ADMIN_SCOPE = "admin";
const AUDIT_PREFIX = "[carte-orders-backend][refund-reconcile]";

interface RuntimeSettings {
  settings?: {
    stripeSecretKey?: string;
  };
}

interface RefundInput {
  orderId: string;
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

interface StripeRefundResponse {
  id?: unknown;
  payment_intent?: unknown;
  amount?: unknown;
  status?: unknown;
  created?: unknown;
}

interface ContentStore {
  update(collection: string, id: string, value: unknown): Promise<void>;
}

interface RefundMetadata {
  id: string;
  paymentIntentId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface RefundRouteResponse {
  ok: true;
  refundId: string;
  status: string;
}

export const refundRoute = async (ctx: RouteContext): Promise<RefundRouteResponse> => {
  requireAdminScope(ctx);
  const input = validateRefundInput(ctx.input);
  const refund = await createStripeRefund(ctx, input);
  const metadata = refundMetadata(refund);

  waitUntil(ctx, reconcileOrderState(ctx, input.orderId, metadata));

  return { ok: true, refundId: metadata.id, status: metadata.status };
};

const reconcileOrderState = async (
  ctx: RouteContext,
  orderId: string,
  metadata: RefundMetadata,
): Promise<void> => {
  try {
    await contentStore(ctx).update("carte_orders", orderId, {
      status: "refunded",
      refund: metadata,
    });
  } catch (error) {
    // Stripe is the source of truth for refund settlement; surface a
    // structured audit record so an operator can reconcile the order
    // record by hand instead of letting the failure escape silently.
    console.error(`${AUDIT_PREFIX} content update failed`, {
      orderId,
      refundId: metadata.id,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
};

const waitUntil = (ctx: RouteContext, task: Promise<void>): void => {
  const waitUntilFn = (ctx as RouteContext & { waitUntil?: (task: Promise<void>) => void })
    .waitUntil;
  if (!waitUntilFn) {
    throw new Error("Refund route requires ctx.waitUntil for post-response reconciliation.");
  }

  waitUntilFn(task);
};

const requireAdminScope = (ctx: RouteContext): void => {
  const scopes = (ctx as RouteContext & { auth?: { scopes?: string[] } }).auth?.scopes;
  if (!scopes?.includes(ADMIN_SCOPE)) {
    throw new Error("Refund route requires admin scope.");
  }
};

const validateRefundInput = (input: unknown): RefundInput => {
  if (!isRefundInput(input)) {
    throw new Error("Refund request shape is invalid.");
  }

  if (!input.orderId || !input.paymentIntentId) {
    throw new Error("Refund requires orderId and paymentIntentId.");
  }

  return input;
};

const isRefundInput = (input: unknown): input is RefundInput => {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const candidate = input as Partial<RefundInput>;
  return typeof candidate.orderId === "string" && typeof candidate.paymentIntentId === "string";
};

const createStripeRefund = async (
  ctx: RouteContext,
  input: RefundInput,
): Promise<StripeRefundResponse> => {
  const response = await requireHttp(ctx).fetch(STRIPE_REFUNDS_URL, {
    method: "POST",
    headers: stripeHeaders(ctx, input.orderId),
    body: stripeBody(input),
  });

  return parseStripeRefund(response);
};

const requireHttp = (ctx: RouteContext) => {
  if (!ctx.http) {
    throw new Error("Refund requires network access.");
  }

  return ctx.http;
};

const stripeHeaders = (ctx: RouteContext, orderId: string): HeadersInit => ({
  Authorization: `Bearer ${requireStripeSecret(ctx)}`,
  "Content-Type": "application/x-www-form-urlencoded",
  "Idempotency-Key": `refund-${orderId}`,
});

const requireStripeSecret = (ctx: RouteContext): string => {
  const secret = (ctx as RouteContext & RuntimeSettings).settings?.stripeSecretKey;
  if (!secret) {
    throw new Error("Refund requires Stripe secret setting.");
  }

  return secret;
};

const stripeBody = (input: RefundInput): string => {
  const body = new URLSearchParams({
    payment_intent: input.paymentIntentId,
    "metadata[orderId]": input.orderId,
  });

  appendOptionalNumber(body, "amount", input.amount);
  appendOptionalString(body, "reason", input.reason);
  return body.toString();
};

const appendOptionalNumber = (body: URLSearchParams, key: string, value?: number): void => {
  if (typeof value === "number") {
    body.set(key, String(value));
  }
};

const appendOptionalString = (body: URLSearchParams, key: string, value?: string): void => {
  if (value) {
    body.set(key, value);
  }
};

const parseStripeRefund = async (response: Response): Promise<StripeRefundResponse> => {
  if (!response.ok) {
    throw new Error(`Stripe refund failed with status ${response.status}.`);
  }

  return (await response.json()) as StripeRefundResponse;
};

const refundMetadata = (refund: StripeRefundResponse): RefundMetadata => ({
  id: stringValue(refund.id),
  paymentIntentId: stringValue(refund.payment_intent),
  amount: numberValue(refund.amount),
  status: stringValue(refund.status),
  createdAt: createdAtIso(refund.created),
});

const createdAtIso = (created: unknown): string =>
  typeof created === "number" ? new Date(created * 1000).toISOString() : new Date().toISOString();

const contentStore = (ctx: RouteContext): ContentStore =>
  (ctx as RouteContext & { content: ContentStore }).content;

const stringValue = (value: unknown): string => (typeof value === "string" ? value : "");

const numberValue = (value: unknown): number => (typeof value === "number" ? value : 0);
