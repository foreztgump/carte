// @carte/orders-backend — sandboxed EmDash plugin skeleton.
//
// v0.1 scope (later mission): Stripe Checkout creation, idempotent
// webhook receiver, refund. Stripe Checkout handles all card data —
// Carte infrastructure NEVER receives raw PAN/CVC. The webhook is
// idempotent via `ctx.kv` `idempotency:{stripeEventId}` with 7-day TTL.
//
// Sandbox budget: each handler must fit inside 50ms CPU + 10 subrequests
// + 30s wall-time + ~128MB memory. The future webhook is expected to use
// ~7 of 10 subrequests; stay within budget.

import { definePlugin } from "emdash";

import { enforceRateLimit, rateLimitResponse } from "./rate-limit.js";

import type { RouteContext } from "emdash";

const PLUGIN_ID = "carte-orders-backend";
const PLUGIN_VERSION = "0.1.0";
const STRIPE_IDEMPOTENCY_TTL_SECONDS = 604_800;

type StripeWebhookInput = {
  event?: { id?: unknown };
  id?: unknown;
};

type IdempotencyKv = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { expirationTtl: number }): Promise<void>;
};

type WaitUntilContext = {
  waitUntil?(promise: Promise<unknown>): void;
};

const jsonResponse = (body: unknown, status = 200): Response => Response.json(body, { status });

const stripeEventId = (ctx: RouteContext): string | null => {
  const input = ctx.input as StripeWebhookInput;
  const eventId = input.event?.id ?? input.id;
  return typeof eventId === "string" && eventId.length > 0 ? eventId : null;
};

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

const rateLimitedRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<Response | { ok: true; plugin: string; route: string }> => {
    const limit = await enforceRateLimit(ctx, route);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
    return { ok: true, plugin: PLUGIN_ID, route };
  };

const stripeWebhookRoute = async (ctx: RouteContext): Promise<Response> => {
  const eventId = stripeEventId(ctx);
  if (eventId === null) return jsonResponse({ ok: false, error: "missing-event-id" }, 400);
  const key = `idempotency:${eventId}`;
  const kv = ctx.kv as IdempotencyKv;
  const existing = await kv.get<string>(key);
  if (existing !== null) return jsonResponse({ ok: true, replay: true });
  await kv.set(key, "processed", { expirationTtl: STRIPE_IDEMPOTENCY_TTL_SECONDS });
  (ctx as unknown as WaitUntilContext).waitUntil?.(Promise.resolve());
  return jsonResponse({ ok: true, replay: false });
};

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write", "email:send", "network:request"],
    allowedHosts: ["api.stripe.com", "checkout.stripe.com"],
    hooks: {},
    routes: {
      admin: { handler: stubRoute("admin") },
      checkout: { handler: rateLimitedRoute("checkout"), public: true },
      "webhook-stripe": { handler: stripeWebhookRoute, public: true },
      refund: { handler: stubRoute("refund") },
    },
  });

export default factory;
