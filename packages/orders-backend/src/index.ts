// @carte/orders-backend — sandboxed EmDash plugin.
//
// Tender hosted-checkout creation, refund reconciliation, and the order
// state-machine seam (pending → paid → refunded). Tender owns payment-card
// details; Carte receives only Tender payment references. The plugin descriptor
// is emitted by `emdash-plugin build` from emdash-plugin.jsonc — never
// hand-rolled here.

export { default } from "./plugin.js";

export {
  applyTenderTransaction,
  TENDER_TRANSACTION_PROCESSED_VALUE,
  type OrderTrigger,
  type OrderTransitionContext,
  type TenderTransactionEvent,
} from "./events.js";
export { createOrderLineItemSnapshot, type OrderLineItemSnapshot } from "./order-snapshot.js";
export { createStaleStripeSettingsWarning } from "./stale-stripe-warning.js";
