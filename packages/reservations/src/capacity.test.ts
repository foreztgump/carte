import { describe, expect, it, vi } from "vitest";

import {
  HOLD_TTL_SECONDS,
  createHold,
  createMemoryCapacityStore,
  expireHold,
  reserveCapacity,
} from "./capacity.js";

const SLOT = { date: "2026-05-06", slot: "18:00" } as const;

describe("reservation capacity holds", () => {
  it("settles 100 concurrent submits for capacity 50 to exactly 50 successes", async () => {
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
    await expect(store.getCapacity(SLOT)).resolves.toBe(0);
  });

  it("writes holds with a ten minute ttl and restores capacity through waitUntil on expiry", async () => {
    const store = createMemoryCapacityStore();
    const waitUntil = vi.fn();
    await store.setCapacity(SLOT, 1);

    await createHold(store, { ...SLOT, partySize: 1, holdId: "hold-expiring" });
    await expireHold(store, "hold-expiring", waitUntil);

    expect(store.holdWrites).toEqual([
      expect.objectContaining({ key: "hold:hold-expiring", ttlSeconds: HOLD_TTL_SECONDS }),
    ]);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
    await expect(store.getCapacity(SLOT)).resolves.toBe(1);
  });
});
