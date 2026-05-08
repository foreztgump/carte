import type { RouteContext } from "emdash";

// Two-phase idempotency: a synchronous `in-progress` marker is written
// before the response returns; the marker is upgraded to `completed`
// inside ctx.waitUntil only after the order/email work succeeds. On
// re-delivery, `completed` short-circuits while `in-progress` (left by a
// previously crashed waitUntil) is treated as retry-eligible so the order
// is never lost when the post-response work fails transiently.
//
// Subrequest audit: invalid signatures use 0/10 state subrequests. First
// delivery uses KV get + KV set(in-progress) + content create + receipt
// email + KV set(completed) = 5/10. Re-delivery on `completed` uses only
// KV get = 1/10. Re-delivery on `in-progress` uses 5/10 (retry path).
// All variants stay under the webhook cap of 7/10 for the sandboxed route.
const IDEMPOTENCY_TTL_SECONDS = 604_800;
const IDEMPOTENCY_IN_PROGRESS = "in-progress";
const IDEMPOTENCY_COMPLETED = "completed";
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
  const existingMarker = await kvStore(ctx).get(idempotencyKey);
  if (existingMarker === IDEMPOTENCY_COMPLETED) {
    return { ok: true, status: 200, idempotent: true };
  }

  // Phase 1: claim the work synchronously so concurrent re-deliveries see
  // an in-progress marker. Phase 2 runs inside waitUntil and upgrades the
  // marker to "completed" only after the work succeeds (HR2).
  await writeIdempotencyMarker(ctx, idempotencyKey, IDEMPOTENCY_IN_PROGRESS);
  waitUntil(ctx, completeStripeEvent(ctx, verifiedEvent, idempotencyKey));
  return { ok: true, status: 200, idempotent: false };
};

const writeIdempotencyMarker = async (
  ctx: RouteContext,
  key: string,
  value: typeof IDEMPOTENCY_IN_PROGRESS | typeof IDEMPOTENCY_COMPLETED,
): Promise<void> => {
  await kvStore(ctx).set(key, value, { expirationTtl: IDEMPOTENCY_TTL_SECONDS });
};

const completeStripeEvent = async (
  ctx: RouteContext,
  event: StripeEvent,
  idempotencyKey: string,
): Promise<void> => {
  await processStripeEvent(ctx, event);
  await writeIdempotencyMarker(ctx, idempotencyKey, IDEMPOTENCY_COMPLETED);
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
  // Guarded parse: malformed JSON must surface as a 400 (signature/body
  // invalid) rather than a 500 — Stripe retries 5xx but treats 4xx as a
  // permanent failure, preventing redelivery storms on bad payloads.
  const event = safeParseJson(body);
  if (!event || !event.id || !event.type || !event.data?.object) {
    return null;
  }

  return event as StripeEvent;
};

const safeParseJson = (body: string): Partial<StripeEvent> | null => {
  try {
    return JSON.parse(body) as Partial<StripeEvent>;
  } catch {
    return null;
  }
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
