import { createTenderClient } from "@tender/sdk";
import type { RouteContext } from "emdash";

// Subrequest audit: public checkout uses 1 KV get + 1 KV set for rate
// limiting, 1 KV set for the cart hold, and normally 1 Tender charge fetch.
// The Tender SDK may retry transient 502/503/504 responses up to 3 attempts,
// so the worst-case retry path is 6/10 and remains under the sandbox cap.
const ORIGINATING_PLUGIN_ID = "carte-orders-backend";
const CART_HOLD_TTL_SECONDS = 600;

interface CheckoutLineItemInput {
  name: string;
  unitAmount: number;
  quantity: number;
}

interface CheckoutInput {
  cartId: string;
  orderId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: CheckoutLineItemInput[];
}

interface RuntimeSettings {
  settings?: {
    tenderBaseUrl?: string;
    tenderPluginToken?: string;
    currency?: string;
  };
}

interface KvWithTtl {
  set(key: string, value: unknown, options: { expirationTtl: number }): Promise<void>;
}

export interface CheckoutRouteResponse {
  checkoutUrl: string;
}

export const checkoutRoute = async (ctx: RouteContext): Promise<CheckoutRouteResponse> => {
  const input = validateCheckoutInput(ctx.input);
  await persistCartHold(ctx, input);
  const tenderResponse = await createTenderCharge(ctx, input);

  return { checkoutUrl: tenderResponse.checkoutUrl };
};

const validateCheckoutInput = (input: unknown): CheckoutInput => {
  if (!isCheckoutInput(input)) {
    throw new Error("Checkout request shape is invalid.");
  }

  const checkoutInput = input;
  if (!checkoutInput.cartId || checkoutInput.lineItems.length === 0) {
    throw new Error("Checkout requires cartId and at least one line item.");
  }

  for (const item of checkoutInput.lineItems) {
    if (!item.name || item.quantity < 1 || item.unitAmount < 0) {
      throw new Error("Checkout line items require name, quantity, and unit amount.");
    }
  }

  return checkoutInput;
};

const isCheckoutInput = (input: unknown): input is CheckoutInput => {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const candidate = input as Partial<CheckoutInput>;
  return (
    typeof candidate.cartId === "string" &&
    typeof candidate.successUrl === "string" &&
    typeof candidate.cancelUrl === "string" &&
    Array.isArray(candidate.lineItems)
  );
};

const persistCartHold = async (ctx: RouteContext, input: CheckoutInput): Promise<void> => {
  const createdAt = new Date().toISOString();
  const value = {
    cartId: input.cartId,
    lineItems: input.lineItems,
    createdAt,
    expiresAt: new Date(Date.now() + CART_HOLD_TTL_SECONDS * 1000).toISOString(),
  };

  await (ctx.kv as KvWithTtl).set(`cart-hold:${input.cartId}`, value, {
    expirationTtl: CART_HOLD_TTL_SECONDS,
  });
};

const createTenderCharge = async (
  ctx: RouteContext,
  input: CheckoutInput,
): Promise<{ checkoutUrl: string }> => {
  const response = await tenderClient(ctx).charge({
    flow: "hosted",
    amount: checkoutAmount(input),
    currency: readCurrency(ctx),
    customerEmail: input.customerEmail ?? "",
    returnUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    description: checkoutDescription(input),
    metadata: tenderMetadata(input),
    originatingPluginId: ORIGINATING_PLUGIN_ID,
  });

  return parseTenderChargeResponse(response.checkoutUrl);
};

const requireHttp = (ctx: RouteContext) => {
  if (!ctx.http) {
    throw new Error("Checkout requires network access.");
  }

  return ctx.http;
};

const tenderClient = (ctx: RouteContext) => {
  const settings = (ctx as RouteContext & RuntimeSettings).settings;
  const baseUrl = settings?.tenderBaseUrl;
  const pluginToken = settings?.tenderPluginToken;
  if (!baseUrl || !pluginToken) {
    throw new Error("Checkout requires Tender base URL and plugin token settings.");
  }

  return createTenderClient({
    baseUrl,
    pluginToken,
    fetch: requireHttp(ctx).fetch as typeof fetch,
  });
};

const readCurrency = (ctx: RouteContext): string =>
  (ctx as RouteContext & RuntimeSettings).settings?.currency ?? "usd";

const checkoutAmount = (input: CheckoutInput): number =>
  input.lineItems.reduce((total, item) => total + item.unitAmount * item.quantity, 0);

const checkoutDescription = (input: CheckoutInput): string =>
  input.lineItems.map((item) => `${item.name} x${item.quantity}`).join(", ");

const tenderMetadata = (
  input: CheckoutInput,
): { carte_order_id: string; carte_cart_id: string } => ({
  carte_order_id: input.orderId ?? input.cartId,
  carte_cart_id: input.cartId,
});

const parseTenderChargeResponse = (checkoutUrl: string | undefined) => {
  if (!checkoutUrl) {
    throw new Error("Tender charge response did not include a checkout URL.");
  }

  return { checkoutUrl };
};
