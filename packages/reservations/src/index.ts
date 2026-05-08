// @carte/reservations — sandboxed EmDash plugin skeleton.
//
// v0.1 scope (later mission): reservation requests, capacity-aware
// availability, host + guest email confirmations, cancel-by-token.
// Capacity counters use ctx.kv atomic decrement (race-safe pattern).
// Email sends are wrapped in ctx.waitUntil per Issue #710.
//
// Sandbox budget reminder (per AGENTS.md): each route handler must fit
// inside 50ms CPU + 10 subrequests + 30s wall-time + ~128MB memory.

import { definePlugin } from "emdash";

import { enforceRateLimit, rateLimitResponse } from "./rate-limit.js";

import type { RouteContext } from "emdash";

const PLUGIN_ID = "carte-reservations";
const PLUGIN_VERSION = "0.1.0";

type SubmitInput = {
  capacityKey?: unknown;
};

type AtomicCapacityKv = {
  atomicDecrement(key: string, amount: number): Promise<number>;
};

const isCapacitySubmit = (ctx: RouteContext): string | null => {
  const input = ctx.input as SubmitInput;
  return typeof input.capacityKey === "string" && input.capacityKey.length > 0
    ? input.capacityKey
    : null;
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
    // Apply per-IP rate limiting BEFORE any capacity-key short-circuit.
    // Otherwise an attacker can flood /submit by attaching any capacityKey
    // value and bypass the limiter entirely.
    const limit = await enforceRateLimit(ctx, route);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
    const capacityKey = isCapacitySubmit(ctx);
    if (capacityKey !== null) return capacitySubmitRoute(ctx, capacityKey);
    return { ok: true, plugin: PLUGIN_ID, route };
  };

const capacitySubmitRoute = async (
  ctx: RouteContext,
  capacityKey: string,
): Promise<Response | { ok: true; plugin: string; route: string }> => {
  const kv = ctx.kv as unknown as AtomicCapacityKv;
  const remaining = await kv.atomicDecrement(capacityKey, 1);
  if (remaining < 0) return Response.json({ ok: false, error: "sold-out" }, { status: 409 });
  return { ok: true, plugin: PLUGIN_ID, route: "submit" };
};

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write", "email:send"],
    hooks: {},
    routes: {
      admin: { handler: stubRoute("admin") },
      submit: { handler: rateLimitedRoute("submit"), public: true },
      confirm: { handler: stubRoute("confirm"), public: true },
      "cancel-by-token": { handler: stubRoute("cancel-by-token"), public: true },
    },
    admin: {
      pages: [
        { path: "/carte-reservations", label: "Reservations", icon: "calendar" },
        { path: "/carte-reservations/blocks", label: "Closures", icon: "x-circle" },
      ],
    },
  });

export default factory;
