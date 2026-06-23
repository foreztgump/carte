import {
  createKvDedupStore,
  fulfillTransaction,
  TenderEventWatchAbortedError,
  type TenderTransactionEvent,
} from "@tenderpay/sdk";
import type { RouteContext } from "emdash";

import { applyTenderTransaction, type OrderTransitionContext } from "../events.js";
import { tenderClientFromContext } from "./tender-client.js";

// Return-URL drive point for Tender fulfillment. The customer's browser lands
// here after the hosted checkout redirect; we short-poll the transaction to a
// terminal `paid` status and apply the order transition in-request. The sandbox
// has no post-response primitive, so the poll is bounded by an AbortController —
// a still-processing transaction returns `processing` for the client to retry.
const RETURN_POLL_BUDGET_MS = 2000;
const PROCESSING_STATUS = "processing";
const AUDIT_PREFIX = "[carte-orders-backend][return-fulfill]";

export interface ReturnRouteResponse {
  status: string;
}

export const returnRoute = async (ctx: RouteContext): Promise<ReturnRouteResponse> => {
  const transactionId = validateTransactionId(ctx.input);
  const controller = new AbortController();
  const budget = setTimeout(() => controller.abort(), RETURN_POLL_BUDGET_MS);
  try {
    const transaction = await fulfillTransaction(transactionId, {
      client: tenderClientFromContext(ctx),
      delivered: createKvDedupStore(ctx.kv),
      interestingStatuses: ["paid"],
      signal: controller.signal,
      onEvent: (event) => fulfillOrder(ctx, event),
    });
    return { status: transaction.status };
  } catch (error) {
    // Budget exhaustion is the normal "not settled yet" path. Any other poll or
    // delivery failure (e.g. a transient content-store error) leaves the SDK
    // dedup key unrecorded — the SDK's documented retry contract — so the safe,
    // truthful response to the customer is still `processing`. Audit non-abort
    // failures so an operator can reconcile; never escape a 500 on this public
    // return URL. The token stays out of the log (HR10).
    if (!(error instanceof TenderEventWatchAbortedError)) {
      console.error(`${AUDIT_PREFIX} fulfillment failed`, {
        transactionId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    return { status: PROCESSING_STATUS };
  } finally {
    clearTimeout(budget);
  }
};

/**
 * Idempotent reaction: correlate the transaction back to its Carte order via the
 * `carte_order_id` metadata round-tripped from checkout, then drive the order's
 * `paid` transition. A missing or empty correlation id is a no-op (the order was
 * not created by this consumer).
 */
const fulfillOrder = async (ctx: RouteContext, event: TenderTransactionEvent): Promise<void> => {
  const orderId = event.transaction.metadata.carte_order_id;
  if (typeof orderId !== "string" || orderId.length === 0) {
    return;
  }

  await applyTenderTransaction(orderTransitionContext(ctx), {
    transactionId: event.transactionId,
    orderId,
    trigger: "paid",
  });
};

// EmDash's `content.update` resolves to a `ContentItem`; the order-transition
// seam only needs the `void`-returning slice. Narrow the context to the seam's
// structural interface here (mirrors the refund route's `contentStore` cast)
// rather than widening the shared seam's type.
const orderTransitionContext = (ctx: RouteContext): OrderTransitionContext =>
  ctx as unknown as OrderTransitionContext;

const validateTransactionId = (input: unknown): string => {
  if (typeof input === "object" && input !== null) {
    const candidate = (input as { transactionId?: unknown }).transactionId;
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  throw new Error("Return route requires a transactionId.");
};
