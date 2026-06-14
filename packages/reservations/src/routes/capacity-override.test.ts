import { describe, expect, it, vi } from "vitest";

import { getCapacityStore } from "./context.js";
import type { ReservationRouteContext } from "./types.js";
import { CapacityExceededError } from "../capacity.js";
import { computeAvailableSlots } from "../availability/read-time-slots.js";
import { pluginContextFields } from "../test-support.js";

const SLOT = { date: "2026-05-06", slot: "18:00" } as const;
const GLOBAL_CAPACITY = 50;
const OVERRIDE_SEATS = 2;
const SLOT_START = "2026-05-06T18:00:00.000Z";
const SLOT_END = "2026-05-06T18:30:00.000Z";
const MISSING_CAPACITY_ERROR =
  "Reservations plugin requires capacityPerSlot to be configured in plugin settings";

interface BlockRow {
  startsAt: string;
  endsAt: string;
  capacityOverride?: number;
}

describe("write-time capacity honors per-slot block overrides", () => {
  it("does not oversell a 2-seat override slot under a global 50 ceiling", async () => {
    const ctx = makeContext([
      { startsAt: SLOT_START, endsAt: SLOT_END, capacityOverride: OVERRIDE_SEATS },
    ]);
    const store = getCapacityStore(ctx);

    const results = await Promise.allSettled(
      Array.from({ length: 12 }, (_, index) =>
        store.claim({ ...SLOT, partySize: 1, holdId: `override-${index}` }),
      ),
    );

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(OVERRIDE_SEATS);
    expect(
      rejected.every(
        (result) => result.status === "rejected" && result.reason instanceof CapacityExceededError,
      ),
    ).toBe(true);
  });

  it("rejects every claim for a closure block with no override (slot closed)", async () => {
    const ctx = makeContext([{ startsAt: SLOT_START, endsAt: SLOT_END }]);
    const store = getCapacityStore(ctx);

    await expect(store.claim({ ...SLOT, partySize: 1, holdId: "closed" })).rejects.toBeInstanceOf(
      CapacityExceededError,
    );
  });

  it("agrees with the read-time advertised capacity for the override slot", async () => {
    const ctx = makeContext([
      { startsAt: SLOT_START, endsAt: SLOT_END, capacityOverride: OVERRIDE_SEATS },
    ]);
    const store = getCapacityStore(ctx);

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) =>
        store.claim({ ...SLOT, partySize: 1, holdId: `agree-${index}` }),
      ),
    );
    const writeCeiling = results.filter((result) => result.status === "fulfilled").length;

    const [advertised] = computeAvailableSlots({
      date: SLOT.date,
      now: "2026-05-06T15:00:00.000Z",
      settings: { capacityPerSlot: GLOBAL_CAPACITY, slotMinutes: 30, leadMinutes: 60 },
      hours: [{ weekday: 3, opensAt: "18:00", closesAt: "18:30" }],
      blocks: [{ startsAt: SLOT_START, endsAt: SLOT_END, capacityOverride: OVERRIDE_SEATS }],
      bookings: [],
      holds: [],
    });

    expect(writeCeiling).toBe(OVERRIDE_SEATS);
    expect(advertised?.capacity).toBe(OVERRIDE_SEATS);
  });

  it("throws a configuration error when capacityPerSlot is not configured", async () => {
    const ctx = makeContext([], { omitCapacitySetting: true });
    const store = getCapacityStore(ctx);

    await expect(store.claim({ ...SLOT, partySize: 1, holdId: "unconfigured" })).rejects.toThrow(
      MISSING_CAPACITY_ERROR,
    );
  });
});

function makeContext(
  blocks: BlockRow[],
  options: { capacityPerSlot?: number; omitCapacitySetting?: boolean } = {},
): ReservationRouteContext {
  const kv = new Map<string, unknown>();
  if (options.omitCapacitySetting !== true) {
    kv.set("settings:capacityPerSlot", options.capacityPerSlot ?? GLOBAL_CAPACITY);
  }
  const capacityRows = new Map<string, unknown>();
  const storage = {
    carte_reservation_capacity: collection(capacityRows),
    carte_reservation_blocks: blockCollection(blocks),
  };
  const context = {
    input: {},
    request: new Request("https://example.com/"),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
    kv: {
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      set: vi.fn(async () => undefined),
      delete: vi.fn(async () => true),
      list: vi.fn(async () => []),
    },
  };
  return Object.assign(
    context,
    pluginContextFields(storage as Record<string, unknown>),
  ) as ReservationRouteContext;
}

function collection(rows: Map<string, unknown>) {
  return {
    get: async (id: string) => rows.get(id) ?? null,
    exists: async (id: string) => rows.has(id),
    put: async (id: string, data: unknown) => void rows.set(id, data),
    delete: async (id: string) => rows.delete(id),
    query: async (options?: { where?: Record<string, unknown> }) => {
      const slotKey = options?.where?.slotKey;
      const items = [...rows.entries()]
        .filter(
          ([, data]) => slotKey === undefined || (data as { slotKey?: string }).slotKey === slotKey,
        )
        .map(([id, data]) => ({ id, data }));
      return { items };
    },
  };
}

function blockCollection(blocks: BlockRow[]) {
  return {
    get: async () => null,
    exists: async () => false,
    put: async () => undefined,
    delete: async () => false,
    query: async () => ({ items: blocks.map((data, index) => ({ id: `block-${index}`, data })) }),
  };
}
