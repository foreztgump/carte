import type { RouteContext } from "emdash";

interface BlockKitItem {
  label: string;
  value: string;
}

interface BlockKitSection {
  type: "section";
  label: string;
  text: string;
}

interface BlockKitStats {
  type: "stats";
  label: string;
  items: BlockKitItem[];
}

interface BlockKitPage {
  type: "page";
  title: string;
  blocks: Array<BlockKitSection | BlockKitStats>;
}

const orderPipelineItems: BlockKitItem[] = [
  { label: "Pending", value: "Awaiting payment confirmation" },
  { label: "Paid", value: "Ready for kitchen review" },
  { label: "Preparing", value: "Being made by the restaurant" },
  { label: "Ready", value: "Waiting for pickup or delivery handoff" },
  { label: "Completed", value: "Fulfilled orders retained for reporting" },
  { label: "Refunded", value: "Refund metadata stored on the order" },
];

const fulfillmentItems: BlockKitItem[] = [
  { label: "Checkout", value: "Stripe Checkout owns card collection" },
  { label: "Webhook", value: "Stripe events create idempotent order records" },
  { label: "Refunds", value: "Admin refund calls use deterministic idempotency keys" },
];

export const adminRoute = async (ctx: RouteContext): Promise<BlockKitPage> => {
  void ctx;
  return {
    type: "page",
    title: "Carte Orders",
    blocks: [
      {
        type: "section",
        label: "Orders summary",
        text: "Read only overview for the sandboxed orders backend. Native order management ships in M6.",
      },
      { type: "stats", label: "Order pipeline", items: orderPipelineItems },
      { type: "stats", label: "Fulfillment surfaces", items: fulfillmentItems },
      {
        type: "section",
        label: "Operational note",
        text: "Use this page to confirm backend routes are installed without redirecting from the sandbox.",
      },
    ],
  };
};
