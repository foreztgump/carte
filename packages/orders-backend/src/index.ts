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
      "webhook-stripe": { handler: stubRoute("webhook-stripe"), public: true },
      refund: { handler: stubRoute("refund") },
    },
  });

export default factory;
