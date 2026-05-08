import type { RouteContext } from "emdash";

// Subrequest audit: 1 KV set for cart hold + 1 Stripe Checkout fetch = 2/10,
// which stays below the feature cap of 4/10 for the sandboxed route.
const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";
const CART_HOLD_TTL_SECONDS = 600;

interface CheckoutLineItemInput {
  name: string;
  unitAmount: number;
  quantity: number;
}

interface CheckoutInput {
  cartId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: CheckoutLineItemInput[];
}

interface RuntimeSettings {
  settings?: {
    stripeSecretKey?: string;
    currency?: string;
  };
}

interface KvWithTtl {
  set(key: string, value: unknown, options: { expirationTtl: number }): Promise<void>;
}

interface StripeCheckoutResponse {
  url?: unknown;
}

interface StripeLineItemParams {
  body: URLSearchParams;
  currency: string;
  item: CheckoutLineItemInput;
  index: number;
}

export interface CheckoutRouteResponse {
  checkoutUrl: string;
}

export const checkoutRoute = async (ctx: RouteContext): Promise<CheckoutRouteResponse> => {
  const input = validateCheckoutInput(ctx.input);
  await persistCartHold(ctx, input);
  const stripeResponse = await createStripeCheckoutSession(ctx, input);

  return { checkoutUrl: stripeResponse.url };
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

const createStripeCheckoutSession = async (
  ctx: RouteContext,
  input: CheckoutInput,
): Promise<{ url: string }> => {
  const response = await requireHttp(ctx).fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: stripeHeaders(requireStripeSecret(ctx)),
    body: stripeBody(input, readCurrency(ctx)),
  });

  return parseStripeCheckoutResponse(response);
};

const requireHttp = (ctx: RouteContext) => {
  if (!ctx.http) {
    throw new Error("Checkout requires network access.");
  }

  return ctx.http;
};

const requireStripeSecret = (ctx: RouteContext): string => {
  const secret = (ctx as RouteContext & RuntimeSettings).settings?.stripeSecretKey;
  if (!secret) {
    throw new Error("Checkout requires Stripe secret setting.");
  }

  return secret;
};

const readCurrency = (ctx: RouteContext): string =>
  (ctx as RouteContext & RuntimeSettings).settings?.currency ?? "usd";

const stripeHeaders = (secret: string): HeadersInit => ({
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/x-www-form-urlencoded",
});

const stripeBody = (input: CheckoutInput, currency: string): string => {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "metadata[cartId]": input.cartId,
  });

  appendCustomerEmail(body, input);
  input.lineItems.forEach((item, index) => appendLineItem({ body, currency, item, index }));

  return body.toString();
};

const appendCustomerEmail = (body: URLSearchParams, input: CheckoutInput): void => {
  if (input.customerEmail) {
    body.set("customer_email", input.customerEmail);
  }
};

const appendLineItem = ({ body, currency, item, index }: StripeLineItemParams): void => {
  const prefix = `line_items[${index}]`;
  body.set(`${prefix}[price_data][currency]`, currency);
  body.set(`${prefix}[price_data][unit_amount]`, String(item.unitAmount));
  body.set(`${prefix}[price_data][product_data][name]`, item.name);
  body.set(`${prefix}[quantity]`, String(item.quantity));
};

const parseStripeCheckoutResponse = async (response: Response): Promise<{ url: string }> => {
  if (!response.ok) {
    throw new Error(`Stripe Checkout failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as StripeCheckoutResponse;
  if (typeof payload.url !== "string" || payload.url.length === 0) {
    throw new Error("Stripe Checkout response did not include a URL.");
  }

  return { url: payload.url };
};
