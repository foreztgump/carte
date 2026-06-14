import { describe, expect, it, vi } from "vitest";

import {
  CapacityExceededError,
  HOLD_TTL_SECONDS,
  StorageCapacityStore,
  buildCapacityKey,
  buildHoldKey,
  createHold,
  createMemoryCapacityStore,
  expireHold,
  reserveCapacity,
  type CapacityClaimRow,
  type CapacityCollection,
} from "./capacity.js";

const SLOT = { date: "2026-05-06", slot: "18:00" } as const;
const OVER_QUERY_LIMIT_CLAIMS = 1001;

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

  it("never oversells when concurrent claims run on separate store instances over one collection", async () => {
    const collection = trackingCollection();
    const ceiling = async () => 10;

    const results = await Promise.allSettled(
      Array.from({ length: 24 }, (_, index) =>
        new StorageCapacityStore(collection, ceiling).claim({
          ...SLOT,
          partySize: 1,
          holdId: `cross-${index}`,
        }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    expect(successes).toHaveLength(10);
    expect(collection.rows.size).toBe(10);
  });

  it("excludes expired holds from the seat count without deleting them on the claim path", async () => {
    const collection = trackingCollection();
    await collection.put(buildHoldKey("stale-hold"), expiredRowFor(SLOT));
    const store = new StorageCapacityStore(collection, async () => 1);

    const hold = await store.claim({ ...SLOT, partySize: 1, holdId: "fresh-hold" });

    // Lazy expiry: the stale row is not counted (the 1-seat slot still admits
    // the fresh claim) but the delete is deferred off the accepted-claim path.
    expect(hold.holdId).toBe("fresh-hold");
    expect(collection.rows.has(buildHoldKey("stale-hold"))).toBe(true);
    expect(collection.rows.has(buildHoldKey("fresh-hold"))).toBe(true);
  });

  it("re-claiming an expired hold id persists the fresh claim row", async () => {
    const collection = trackingCollection();
    await collection.put(buildHoldKey("same-hold"), expiredRowFor(SLOT, "same-hold"));
    const store = new StorageCapacityStore(collection, async () => 1);

    await store.claim({ ...SLOT, partySize: 1, holdId: "same-hold" });

    const row = collection.rows.get(buildHoldKey("same-hold"));
    expect(row).toMatchObject({ holdId: "same-hold", partySize: 1 });
    expect(new Date(row?.expiresAt ?? 0).getTime()).toBeGreaterThan(Date.now());
  });

  it("fails loudly instead of admitting a claim when slot survey reaches the query limit", async () => {
    const collection = trackingCollection();
    await seedActiveClaims(collection, OVER_QUERY_LIMIT_CLAIMS);
    const store = new StorageCapacityStore(collection, async () => OVER_QUERY_LIMIT_CLAIMS + 1);

    await expect(store.claim({ ...SLOT, partySize: 1, holdId: "over-limit" })).rejects.toThrow(
      "capacity claim query limit",
    );
    expect(collection.rows.has(buildHoldKey("over-limit"))).toBe(false);
  });

  it("deletes only its own row on release, keeping the claim and cancel paths within budget", async () => {
    const collection = trackingCollection();
    await collection.put(buildHoldKey("stale-hold"), expiredRowFor(SLOT));
    const store = new StorageCapacityStore(collection, async () => 5);
    await store.claim({ ...SLOT, partySize: 1, holdId: "live-hold" });

    await store.release("live-hold");

    // Release performs a single targeted delete (no slot-wide sweep query), so
    // the cancel path stays under the 10-subrequest cap; the expired sibling is
    // left for its own release and is already excluded from seat counts.
    expect(collection.rows.has(buildHoldKey("live-hold"))).toBe(false);
    expect(collection.rows.has(buildHoldKey("stale-hold"))).toBe(true);
  });

  it("persists each claim as a storage row keyed by the hold id with a ttl horizon", async () => {
    const collection = trackingCollection();
    const store = new StorageCapacityStore(collection, async () => 4);

    const before = Date.now();
    await store.claim({ ...SLOT, partySize: 2, holdId: "row-hold" });

    const row = collection.rows.get("hold:row-hold");
    expect(row).toMatchObject({
      kind: "claim",
      holdKey: "hold:row-hold",
      slotKey: "capacity:2026-05-06:18:00",
      partySize: 2,
    });
    const ttlMs = new Date(row?.expiresAt ?? 0).getTime() - before;
    expect(ttlMs).toBeGreaterThanOrEqual((HOLD_TTL_SECONDS - 5) * 1000);
  });
});

async function seedActiveClaims(collection: TrackingCollection, count: number): Promise<void> {
  await Promise.all(
    Array.from({ length: count }, (_, index) => {
      const holdId = `seed-${index}`;
      return collection.put(buildHoldKey(holdId), claimRowFor(SLOT, holdId));
    }),
  );
}

function expiredRowFor(
  slot: { date: string; slot: string },
  holdId = "stale-hold",
): CapacityClaimRow {
  return claimRowFor(slot, holdId, new Date(Date.now() - 1000));
}

function claimRowFor(
  slot: { date: string; slot: string },
  holdId: string,
  expiresAt = new Date(Date.now() + HOLD_TTL_SECONDS * 1000),
): CapacityClaimRow {
  return {
    kind: "claim",
    slotKey: buildCapacityKey(slot),
    date: slot.date,
    slot: slot.slot,
    holdId,
    partySize: 1,
    expiresAt: expiresAt.toISOString(),
  };
}

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
      const limit = options?.limit;
      const items = [...rows.entries()]
        .filter(([, data]) => slotKey === undefined || data.slotKey === slotKey)
        .map(([id, data]) => ({ id, data }));
      return {
        items: limit === undefined ? items : items.slice(0, limit),
      };
    },
  };
}
