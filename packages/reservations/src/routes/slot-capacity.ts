import type { CapacitySlot } from "../capacity.js";
import type { ReservationRouteContext } from "./types.js";

const CAPACITY_SETTING_KEY = "settings:capacityPerSlot";
const BLOCKS_COLLECTION = "carte_reservation_blocks";
const SLOT_BLOCK_QUERY_LIMIT = 100;
const CLOSED_CAPACITY = 0;
const MISSING_CAPACITY_ERROR =
  "Reservations plugin requires capacityPerSlot to be configured in plugin settings";

export class SlotBlockSurveyLimitExceededError extends Error {
  constructor() {
    super("Cannot safely resolve slot capacity: reservation block query limit reached");
    this.name = "SlotBlockSurveyLimitExceededError";
  }
}

export class InvalidSlotCapacityError extends Error {
  constructor(field: "capacityPerSlot" | "capacityOverride") {
    super(`${field} must be a finite non-negative number`);
    this.name = "InvalidSlotCapacityError";
  }
}

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
  if (typeof configured !== "number") throw new Error(MISSING_CAPACITY_ERROR);
  assertCapacityValue("capacityPerSlot", configured);
  return configured;
}

async function readOverlappingBlocks(
  ctx: ReservationRouteContext,
  slot: CapacitySlot,
): Promise<SlotBlockRow[]> {
  const collection = ctx.storage[BLOCKS_COLLECTION] as SlotBlockCollection | undefined;
  if (collection === undefined) return [];
  const instant = slotInstant(slot);
  const result = await collection.query({ limit: SLOT_BLOCK_QUERY_LIMIT });
  if (result.items.length >= SLOT_BLOCK_QUERY_LIMIT) throw new SlotBlockSurveyLimitExceededError();
  return result.items.map((item) => item.data).filter((block) => covers(block, instant));
}

function applyOverrides(global: number, blocks: SlotBlockRow[]): number {
  let ceiling = global;
  for (const block of blocks) {
    if (block.capacityOverride === undefined) return CLOSED_CAPACITY;
    assertCapacityValue("capacityOverride", block.capacityOverride);
    ceiling = Math.min(ceiling, block.capacityOverride);
  }
  return ceiling;
}

function assertCapacityValue(field: "capacityPerSlot" | "capacityOverride", value: number): void {
  if (!Number.isFinite(value) || value < CLOSED_CAPACITY) {
    throw new InvalidSlotCapacityError(field);
  }
}

function covers(block: SlotBlockRow, instant: number): boolean {
  return (
    new Date(block.startsAt).getTime() <= instant && instant < new Date(block.endsAt).getTime()
  );
}

function slotInstant(slot: CapacitySlot): number {
  return new Date(`${slot.date}T${slot.slot}:00.000Z`).getTime();
}
