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
