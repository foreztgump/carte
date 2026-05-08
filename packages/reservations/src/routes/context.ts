import type { ReservationCollection, ReservationRecord, ReservationRouteContext } from "./types.js";
import { RESERVATION_COLLECTION } from "./types.js";
import type { AtomicCapacityStore } from "../capacity.js";

const RATE_LIMIT_PREFIX = "rate-limit:submit";
const RATE_LIMIT_MAX_REQUESTS = 30;
const WINDOW_SECONDS = 60;
const UNKNOWN_IP = "unknown";

export async function getTokenSecret(ctx: ReservationRouteContext): Promise<string> {
  const configured = await ctx.kv.get<string>("settings:tokenSecret");
  if (typeof configured !== "string" || configured.length === 0) {
    throw new Error("Reservations plugin requires tokenSecret to be configured in plugin settings");
  }
  return configured;
}

export function getReservations(ctx: ReservationRouteContext): ReservationCollection {
  const collection = ctx.storage[RESERVATION_COLLECTION] as unknown;
  return collection as ReservationCollection;
}

export function getCapacityStore(ctx: ReservationRouteContext): AtomicCapacityStore {
  if (ctx.capacityStore === undefined) {
    throw new Error("capacityStore is required for reservation routes");
  }
  return ctx.capacityStore;
}

export function defer(ctx: ReservationRouteContext, task: Promise<unknown>): void {
  if (ctx.waitUntil === undefined) {
    void task;
    return;
  }
  ctx.waitUntil(task);
}

interface RateLimitCounter {
  count: number;
  expiresAt: number;
}

// EmDash 0.9 KVAccess.set has no expirationTtl option, so the window expiry is
// embedded in the stored value. Records past their expiresAt are treated as
// reset on the next read and overwritten in place. The read-then-write here is
// best-effort under concurrent submits from the same IP — see HR6 follow-up.
export async function enforceSubmitRateLimit(ctx: ReservationRouteContext): Promise<boolean> {
  const key = `${RATE_LIMIT_PREFIX}:${getClientIp(ctx)}:${getWindowId()}`;
  const now = Date.now();
  const stored = await ctx.kv.get<RateLimitCounter>(key);
  const active = stored !== null && stored !== undefined && stored.expiresAt > now ? stored : null;
  const current = active?.count ?? 0;
  if (current >= RATE_LIMIT_MAX_REQUESTS) return false;
  const next: RateLimitCounter = {
    count: current + 1,
    expiresAt: active?.expiresAt ?? now + WINDOW_SECONDS * 1000,
  };
  await ctx.kv.set(key, next);
  return true;
}

export async function listActiveReservations(
  ctx: ReservationRouteContext,
): Promise<Array<{ id: string; data: ReservationRecord }>> {
  const result = await getReservations(ctx).query({ limit: 100 });
  return result.items.filter((item) => item.data.status !== "cancelled");
}

function getClientIp(ctx: ReservationRouteContext): string {
  return ctx.requestMeta.ip ?? ctx.request.headers.get("CF-Connecting-IP") ?? UNKNOWN_IP;
}

function getWindowId(): number {
  return Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
}
