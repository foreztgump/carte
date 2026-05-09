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

import type { PluginStorageConfig, RouteContext } from "emdash";
import { enforceRateLimit, rateLimitResponse } from "./rate-limit.js";
import { renderReservationsAdmin } from "./routes/admin.js";
import { cancelReservationByToken } from "./routes/cancel.js";
import { confirmReservation } from "./routes/confirm.js";
import { submitReservation } from "./routes/submit.js";

const PLUGIN_ID = "carte-reservations";
const PLUGIN_VERSION = "0.1.0";
const DEFAULT_CAPACITY_PER_SLOT = 20;
const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_LEAD_MINUTES = 120;
const MIN_CAPACITY_PER_SLOT = 1;
const MIN_SLOT_MINUTES = 5;
const MIN_LEAD_MINUTES = 0;

const RESERVATION_STORAGE = {
  carte_reservations: {
    indexes: ["status", "slotStart", "guestEmail", "confirmationToken", "cancelToken"],
    uniqueIndexes: ["confirmationToken", "cancelToken"],
  },
  carte_reservation_blocks: {
    indexes: ["startsAt", "endsAt", "scope"],
  },
} satisfies PluginStorageConfig;

const RESERVATION_SETTINGS = {
  capacityPerSlot: {
    type: "number",
    label: "Capacity per slot",
    description: "Default number of guests available for each reservable time slot.",
    default: DEFAULT_CAPACITY_PER_SLOT,
    min: MIN_CAPACITY_PER_SLOT,
  },
  slotMinutes: {
    type: "number",
    label: "Slot length",
    description: "Reservation slot granularity in minutes.",
    default: DEFAULT_SLOT_MINUTES,
    min: MIN_SLOT_MINUTES,
  },
  leadMinutes: {
    type: "number",
    label: "Lead time",
    description: "Minimum minutes between the current time and a bookable slot.",
    default: DEFAULT_LEAD_MINUTES,
    min: MIN_LEAD_MINUTES,
  },
} as const;

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

const rateLimitedSubmitRoute = async (ctx: RouteContext): Promise<unknown> => {
  const limit = await enforceRateLimit(ctx, "submit");
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  return submitReservation(ctx);
};

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write", "email:send"],
    storage: RESERVATION_STORAGE,
    hooks: {},
    routes: {
      admin: { handler: renderReservationsAdmin },
      "admin/blocks": { handler: stubRoute("admin/blocks") },
      "admin/settings": { handler: stubRoute("admin/settings") },
      submit: { handler: rateLimitedSubmitRoute, public: true },
      confirm: { handler: confirmReservation, public: true },
      "cancel-by-token": { handler: cancelReservationByToken, public: true },
    },
    admin: {
      settingsSchema: RESERVATION_SETTINGS,
      pages: [
        { path: "/carte-reservations", label: "Reservations", icon: "calendar" },
        { path: "/carte-reservations/blocks", label: "Closures", icon: "x-circle" },
      ],
    },
  });

export default factory;
