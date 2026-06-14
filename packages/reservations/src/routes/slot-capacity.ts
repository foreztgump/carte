import type { CapacitySlot } from "../capacity.js";
import type { ReservationRouteContext } from "./types.js";

const CAPACITY_SETTING_KEY = "settings:capacityPerSlot";
const BLOCKS_COLLECTION = "carte_reservation_blocks";
const SLOT_BLOCK_QUERY_LIMIT = 100;
const DEFAULT_SLOT_CAPACITY = 0;
const CLOSED_CAPACITY = 0;

/** One closure/override row, mirrored from the read-time `ReservationBlock` shape. */
interface SlotBlockRow {
  startsAt: string;
  endsAt: string;
  capacityOverride?: number;
}

interface SlotBlockCollection {
  query(options?: {
    limit?: number;
  }): Promise<{ items: Array<{ id: string; data: SlotBlockRow }> }>;
}

/**
 * Write-time seat ceiling for a slot. Mirrors the read-time resolution in
 * `availability/read-time-slots.ts`: the global `settings:capacityPerSlot`
 * value is lowered by any overlapping `capacityOverride` block, and a block
 * with no override closes the slot entirely (ceiling 0). This keeps the claim
 * path from admitting a guest into a slot whose advertised capacity was
 * narrowed by a per-slot override.
 */
export async function resolveSlotCapacity(
  ctx: ReservationRouteContext,
  slot: CapacitySlot,
): Promise<number> {
  const global = await readGlobalCapacity(ctx);
  const blocks = await readOverlappingBlocks(ctx, slot);
  return applyOverrides(global, blocks);
}

async function readGlobalCapacity(ctx: ReservationRouteContext): Promise<number> {
  const configured = await ctx.kv.get<number>(CAPACITY_SETTING_KEY);
  return typeof configured === "number" ? configured : DEFAULT_SLOT_CAPACITY;
}

async function readOverlappingBlocks(
  ctx: ReservationRouteContext,
  slot: CapacitySlot,
): Promise<SlotBlockRow[]> {
  const collection = ctx.storage[BLOCKS_COLLECTION] as SlotBlockCollection | undefined;
  if (collection === undefined) return [];
  const instant = slotInstant(slot);
  const result = await collection.query({ limit: SLOT_BLOCK_QUERY_LIMIT });
  return result.items.map((item) => item.data).filter((block) => covers(block, instant));
}

function applyOverrides(global: number, blocks: SlotBlockRow[]): number {
  let ceiling = global;
  for (const block of blocks) {
    if (block.capacityOverride === undefined) return CLOSED_CAPACITY;
    ceiling = Math.min(ceiling, block.capacityOverride);
  }
  return ceiling;
}

function covers(block: SlotBlockRow, instant: number): boolean {
  return (
    new Date(block.startsAt).getTime() <= instant && instant < new Date(block.endsAt).getTime()
  );
}

function slotInstant(slot: CapacitySlot): number {
  return new Date(`${slot.date}T${slot.slot}:00.000Z`).getTime();
}
