import type { ReservationCollection, ReservationRecord, ReservationRouteContext } from "./types.js";
import { RESERVATION_COLLECTION } from "./types.js";
import type { CapacityCollection, CapacityStore } from "../capacity.js";
import { CAPACITY_COLLECTION, StorageCapacityStore } from "../capacity.js";

const ACTIVE_RESERVATION_QUERY_LIMIT = 100;
const DEFAULT_SLOT_CAPACITY = 0;

export async function getTokenSecret(ctx: ReservationRouteContext): Promise<string> {
  const configured = await ctx.kv.get<string>("settings:tokenSecret");
  if (typeof configured !== "string" || configured.length === 0) {
    throw new Error("Reservations plugin requires tokenSecret to be configured in plugin settings");
  }
  return configured;
}

export function getReservations(ctx: ReservationRouteContext): ReservationCollection {
  return ctx.storage[RESERVATION_COLLECTION] as ReservationCollection;
}

export function getCapacityStore(ctx: ReservationRouteContext): CapacityStore {
  if (ctx.capacityStore !== undefined) return ctx.capacityStore;
  const collection = ctx.storage[CAPACITY_COLLECTION] as CapacityCollection | undefined;
  if (collection === undefined) {
    throw new Error("capacity storage collection is required for reservation routes");
  }
  return new StorageCapacityStore(collection, () => resolveSlotCapacity(ctx));
}

async function resolveSlotCapacity(ctx: ReservationRouteContext): Promise<number> {
  const configured = await ctx.kv.get<number>("settings:capacityPerSlot");
  return typeof configured === "number" ? configured : DEFAULT_SLOT_CAPACITY;
}

export function defer(ctx: ReservationRouteContext, task: Promise<unknown>): void {
  if (ctx.waitUntil === undefined) {
    void task;
    return;
  }
  ctx.waitUntil(task);
}

export async function listActiveReservations(
  ctx: ReservationRouteContext,
): Promise<Array<{ id: string; data: ReservationRecord }>> {
  const result = await getReservations(ctx).query({ limit: ACTIVE_RESERVATION_QUERY_LIMIT });
  return result.items.filter((item) => item.data.status !== "cancelled");
}
