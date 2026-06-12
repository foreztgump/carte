import { describe, expect, it, vi } from "vitest";

import {
  CapacityExceededError,
  HOLD_TTL_SECONDS,
  StorageCapacityStore,
  createHold,
  createMemoryCapacityStore,
  expireHold,
  reserveCapacity,
  type CapacityClaimRow,
  type CapacityCollection,
} from "./capacity.js";

const SLOT = { date: "2026-05-06", slot: "18:00" } as const;

describe("reservation capacity claims", () => {
  it("never oversells under 100 concurrent claims for capacity 50", async () => {
    const store = createMemoryCapacityStore();
    await store.setCapacity(SLOT, 50);

    const results = await Promise.allSettled(
      Array.from({ length: 100 }, (_, index) =>
        reserveCapacity(store, { ...SLOT, partySize: 1, holdId: `hold-${index}` }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    expect(successes).toHaveLength(50);
    expect(failures).toHaveLength(50);
    expect(
      failures.every(
        (result) => result.status === "rejected" && result.reason instanceof CapacityExceededError,
      ),
    ).toBe(true);
    await expect(store.getCapacity(SLOT)).resolves.toBe(0);
  });

  it("never oversells partial parties beyond the seat ceiling", async () => {
    const store = createMemoryCapacityStore();
    await store.setCapacity(SLOT, 10);

    const results = await Promise.allSettled(
      Array.from({ length: 12 }, (_, index) =>
        reserveCapacity(store, { ...SLOT, partySize: 2, holdId: `party-${index}` }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    expect(successes).toHaveLength(5);
    await expect(store.getCapacity(SLOT)).resolves.toBe(0);
  });

  it("resolves a duplicate claim as slot-full instead of throwing through as a 500", async () => {
    const store = createMemoryCapacityStore();
    await store.setCapacity(SLOT, 5);
    const request = { ...SLOT, partySize: 1, holdId: "duplicate-hold" } as const;

    await createHold(store, request);

    await expect(createHold(store, request)).rejects.toBeInstanceOf(CapacityExceededError);
    await expect(store.getCapacity(SLOT)).resolves.toBe(4);
  });

  it("restores a seat through waitUntil when a hold is released", async () => {
    const store = createMemoryCapacityStore();
    const waitUntil = vi.fn();
    await store.setCapacity(SLOT, 1);

    await createHold(store, { ...SLOT, partySize: 1, holdId: "hold-expiring" });
    await expect(store.getCapacity(SLOT)).resolves.toBe(0);
    expireHold(store, "hold-expiring", waitUntil);

    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
    await expect(store.getCapacity(SLOT)).resolves.toBe(1);
  });

  it("persists each claim as a storage row keyed by the hold id with a ttl horizon", async () => {
    const collection = trackingCollection();
    const store = new StorageCapacityStore(collection, async () => 4);

    const before = Date.now();
    await store.claim({ ...SLOT, partySize: 2, holdId: "row-hold" });

    const row = collection.rows.get("hold:row-hold");
    expect(row).toMatchObject({
      kind: "claim",
      slotKey: "capacity:2026-05-06:18:00",
      partySize: 2,
    });
    const ttlMs = new Date(row?.expiresAt ?? 0).getTime() - before;
    expect(ttlMs).toBeGreaterThanOrEqual((HOLD_TTL_SECONDS - 5) * 1000);
  });
});

interface TrackingCollection extends CapacityCollection {
  rows: Map<string, CapacityClaimRow>;
}

function trackingCollection(): TrackingCollection {
  const rows = new Map<string, CapacityClaimRow>();
  return {
    rows,
    get: async (id) => rows.get(id) ?? null,
    exists: async (id) => rows.has(id),
    put: async (id, data) => void rows.set(id, data),
    delete: async (id) => rows.delete(id),
    query: async (options) => {
      const slotKey = options?.where?.slotKey;
      return {
        items: [...rows.entries()]
          .filter(([, data]) => slotKey === undefined || data.slotKey === slotKey)
          .map(([id, data]) => ({ id, data })),
      };
    },
  };
}
