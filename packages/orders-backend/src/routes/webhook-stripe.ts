import type { RouteContext } from "emdash";

// Subrequest audit: invalid signatures use 0/10 state subrequests. First
// delivery uses KV get + KV set + content create + receipt email = 4/10.
// Re-delivery uses only KV get = 1/10. This leaves quota headroom under the
// webhook cap of 7/10 for the sandboxed route.
const IDEMPOTENCY_TTL_SECONDS = 604_800;
const IDEMPOTENCY_VALUE = "processed";
const STRIPE_SIGNATURE_HEADER = "stripe-signature";
const HMAC_ALGORITHM = { name: "HMAC", hash: "SHA-256" };

interface RuntimeSettings {
  settings?: {
    stripeWebhookSecret?: string;
  };
}

interface WebhookInput {
  body: string;
  headers: Record<string, string | undefined>;
}

interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession };
}

interface StripeCheckoutSession {
  id?: unknown;
  customer_email?: unknown;
  amount_total?: unknown;
  currency?: unknown;
  metadata?: Record<string, unknown>;
}

interface KvIdempotencyStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
}

interface ContentStore {
  create(collection: string, value: unknown): Promise<void>;
}

interface EmailSender {
  send(message: unknown): Promise<void>;
}

export interface StripeWebhookResponse {
  ok: boolean;
  status: 200 | 400;
  idempotent?: boolean;
}

export const webhookStripeRoute = async (ctx: RouteContext): Promise<StripeWebhookResponse> => {
  const verifiedEvent = await verifyStripeSignature(ctx);
  if (!verifiedEvent) {
    return { ok: false, status: 400 };
  }

  const idempotencyKey = `idempotency:${verifiedEvent.id}`;
  if (await kvStore(ctx).get(idempotencyKey)) {
    return { ok: true, status: 200, idempotent: true };
  }

  // HR2: KV writes that mark the event "processed" must run inside
  // ctx.waitUntil so they don't block the response and are committed
  // after the work completes.
  waitUntil(ctx, completeStripeEvent(ctx, verifiedEvent, idempotencyKey));
  return { ok: true, status: 200, idempotent: false };
};

const completeStripeEvent = async (
  ctx: RouteContext,
  event: StripeEvent,
  idempotencyKey: string,
): Promise<void> => {
  await processStripeEvent(ctx, event);
  await kvStore(ctx).set(idempotencyKey, IDEMPOTENCY_VALUE, {
    expirationTtl: IDEMPOTENCY_TTL_SECONDS,
  });
};

const verifyStripeSignature = async (ctx: RouteContext): Promise<StripeEvent | null> => {
  const input = readWebhookInput(ctx.input);
  const header = input.headers[STRIPE_SIGNATURE_HEADER];
  const secret = readWebhookSecret(ctx);
  if (!header || !secret) {
    return null;
  }

  return (await signatureMatches({ header, body: input.body, secret }))
    ? parseStripeEvent(input.body)
    : null;
};

const readWebhookInput = (input: unknown): WebhookInput => {
  if (!isWebhookInput(input)) {
    throw new Error("Stripe webhook request shape is invalid.");
  }

  return input;
};

const isWebhookInput = (input: unknown): input is WebhookInput => {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const candidate = input as Partial<WebhookInput>;
  return typeof candidate.body === "string" && isHeaderRecord(candidate.headers);
};

const isHeaderRecord = (headers: unknown): headers is Record<string, string | undefined> =>
  typeof headers === "object" && headers !== null;

const readWebhookSecret = (ctx: RouteContext): string | undefined =>
  (ctx as RouteContext & RuntimeSettings).settings?.stripeWebhookSecret;

const signatureMatches = async (input: {
  header: string;
  body: string;
  secret: string;
}): Promise<boolean> => {
  const parts = parseStripeSignatureHeader(input.header);
  if (!parts) {
    return false;
  }

  const signedPayload = `${parts.timestamp}.${input.body}`;
  const expectedSignature = await hmacSha256Hex(input.secret, signedPayload);
  return timingSafeEqualHex(expectedSignature, parts.signature);
};

const parseStripeSignatureHeader = (
  header: string,
): { timestamp: string; signature: string } | null => {
  const entries = header.split(",").map((part) => part.split("=", 2));
  const timestamp = entries.find(([name]) => name === "t")?.[1];
  const signature = entries.find(([name]) => name === "v1")?.[1];
  return timestamp && signature ? { timestamp, signature } : null;
};

const hmacSha256Hex = async (secret: string, payload: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    HMAC_ALGORITHM,
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const timingSafeEqualHex = (left: string, right: string): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

const parseStripeEvent = (body: string): StripeEvent | null => {
  const event = JSON.parse(body) as Partial<StripeEvent>;
  if (!event.id || !event.type || !event.data?.object) {
    return null;
  }

  return event as StripeEvent;
};

const kvStore = (ctx: RouteContext): KvIdempotencyStore => ctx.kv as KvIdempotencyStore;

const waitUntil = (ctx: RouteContext, task: Promise<void>): void => {
  const waitUntilFn = (ctx as RouteContext & { waitUntil?: (task: Promise<void>) => void })
    .waitUntil;
  if (!waitUntilFn) {
    throw new Error("Stripe webhook processing requires ctx.waitUntil.");
  }

  waitUntilFn(task);
};

const processStripeEvent = async (ctx: RouteContext, event: StripeEvent): Promise<void> => {
  if (event.type !== "checkout.session.completed") {
    return;
  }

  await contentStore(ctx).create("carte_orders", orderFromSession(event));
  await optionalEmailSender(ctx)?.send(receiptEmailFromSession(event));
};

const contentStore = (ctx: RouteContext): ContentStore =>
  (ctx as RouteContext & { content: ContentStore }).content;

const optionalEmailSender = (ctx: RouteContext): EmailSender | undefined =>
  (ctx as RouteContext & { email?: EmailSender }).email;

const orderFromSession = (event: StripeEvent) => {
  const session = event.data.object;
  return {
    status: "paid",
    stripeCheckoutSessionId: stringValue(session.id),
    stripeEventId: event.id,
    email: stringValue(session.customer_email),
    amountTotal: numberValue(session.amount_total),
    currency: stringValue(session.currency),
    cartId: stringValue(session.metadata?.cartId),
    orderType: stringValue(session.metadata?.orderType),
    createdAt: new Date().toISOString(),
  };
};

const receiptEmailFromSession = (event: StripeEvent) => ({
  to: stringValue(event.data.object.customer_email),
  subject: "Your Carte order receipt",
  template: "order-receipt",
  data: { stripeCheckoutSessionId: stringValue(event.data.object.id) },
});

const stringValue = (value: unknown): string => (typeof value === "string" ? value : "");

const numberValue = (value: unknown): number => (typeof value === "number" ? value : 0);
