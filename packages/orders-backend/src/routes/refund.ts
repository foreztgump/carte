import { createTenderClient } from "@tender/sdk";
import type { TenderRefundRecordReason } from "@tender/sdk";
import type { RouteContext } from "emdash";

// Subrequest audit: 1 Tender refund fetch on the request path + 1 content
// update inside ctx.waitUntil = 2/10. Unauthorized callers return before
// external side effects, using 0/10. Tender owns payment settlement and
// remains the source of truth if the deferred content update fails.
const ADMIN_SCOPE = "admin";
const AUDIT_PREFIX = "[carte-orders-backend][refund-reconcile]";
const ORDER_STATUS_REFUNDED = "refunded";

interface RuntimeSettings {
  settings?: {
    tenderBaseUrl?: string;
    tenderPluginToken?: string;
  };
}

interface RefundInput {
  orderId: string;
  transactionId: string;
  amount?: number;
  reason?: string;
}

interface TenderRefundResponse {
  refundId: string;
  transactionId: string;
  status: string;
}

interface TenderRefundRequest {
  transactionId: string;
  amount: number;
  reason: TenderRefundRecordReason;
  reasonNote?: string;
  idempotencyKey: string;
}

interface ContentStore {
  update(collection: string, id: string, value: unknown): Promise<void>;
}

interface RefundMetadata {
  id: string;
  transactionId: string;
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
  const refund = await createTenderRefund(ctx, input);
  const metadata = refundMetadata(refund, input.amount);

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
      status: ORDER_STATUS_REFUNDED,
      refund: metadata,
    });
  } catch (error) {
    // Tender is the source of truth for refund settlement; surface a
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

  if (!input.orderId || !input.transactionId) {
    throw new Error("Refund requires orderId and transactionId.");
  }

  return input;
};

const isRefundInput = (input: unknown): input is RefundInput => {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const candidate = input as Partial<RefundInput>;
  return typeof candidate.orderId === "string" && typeof candidate.transactionId === "string";
};

const createTenderRefund = async (
  ctx: RouteContext,
  input: RefundInput,
): Promise<TenderRefundResponse> => {
  const request: TenderRefundRequest = {
    transactionId: input.transactionId,
    amount: input.amount ?? 0,
    reason: mapRefundReason(input.reason),
    idempotencyKey: `refund-${input.orderId}`,
  };
  if (input.reason) request.reasonNote = input.reason;

  return tenderClient(ctx).refund(request);
};

const requireHttp = (ctx: RouteContext) => {
  if (!ctx.http) {
    throw new Error("Refund requires network access.");
  }

  return ctx.http;
};

const tenderClient = (ctx: RouteContext) => {
  const settings = (ctx as RouteContext & RuntimeSettings).settings;
  const baseUrl = settings?.tenderBaseUrl;
  const pluginToken = settings?.tenderPluginToken;
  if (!baseUrl || !pluginToken) {
    throw new Error("Refund requires Tender base URL and plugin token settings.");
  }

  return createTenderClient({
    baseUrl,
    pluginToken,
    fetch: requireHttp(ctx).fetch as typeof fetch,
  });
};

const mapRefundReason = (reason: string | undefined): TenderRefundRecordReason => {
  const normalized = reason?.toLowerCase().replace(/[_-]/g, " ") ?? "";
  if (normalized.includes("duplicate")) return "duplicate";
  if (normalized.includes("fraud")) return "fraudulent";
  if (normalized.includes("request") || normalized.includes("customer")) {
    return "requested-by-customer";
  }
  return "other";
};

const refundMetadata = (refund: TenderRefundResponse, amount?: number): RefundMetadata => ({
  id: refund.refundId,
  transactionId: refund.transactionId,
  amount: amount ?? 0,
  status: refund.status,
  createdAt: new Date().toISOString(),
});

const contentStore = (ctx: RouteContext): ContentStore =>
  (ctx as RouteContext & { content: ContentStore }).content;
