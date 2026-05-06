import { describe, expect, it } from "vitest";

import { computeAvailableSlots, estimateSlotReadSubrequests } from "./read-time-slots.js";

const DATE = "2026-05-06";
const WEDNESDAY = 3;

describe("read-time reservation slots", () => {
  it("derives slots from hours minus blocks, bookings, and active holds", () => {
    const slots = computeAvailableSlots({
      date: DATE,
      now: "2026-05-06T15:00:00.000Z",
      settings: { capacityPerSlot: 4, slotMinutes: 30, leadMinutes: 60 },
      hours: [{ weekday: WEDNESDAY, opensAt: "17:00", closesAt: "20:00" }],
      blocks: [
        { startsAt: "2026-05-06T17:30:00.000Z", endsAt: "2026-05-06T18:00:00.000Z" },
        {
          startsAt: "2026-05-06T18:00:00.000Z",
          endsAt: "2026-05-06T18:30:00.000Z",
          capacityOverride: 3,
        },
      ],
      bookings: [
        { date: DATE, slot: "18:00", partySize: 2, status: "confirmed" },
        { date: DATE, slot: "19:30", partySize: 4, status: "pending" },
        { date: DATE, slot: "19:00", partySize: 4, status: "cancelled" },
      ],
      holds: [
        { date: DATE, slot: "18:00", partySize: 1, expiresAt: "2026-05-06T15:10:00.000Z" },
        { date: DATE, slot: "19:00", partySize: 4, expiresAt: "2026-05-06T14:59:59.000Z" },
      ],
    });

    expect(slots).toEqual([slot("17:00", 4), slot("18:30", 4), slot("19:00", 4)]);
  });

  it("keeps worst-case read-time fetches inside the sandbox subrequest budget", () => {
    const startedAt = performance.now();

    const slots = computeAvailableSlots({
      date: DATE,
      now: "2026-05-06T15:00:00.000Z",
      settings: { capacityPerSlot: 20, slotMinutes: 5, leadMinutes: 0 },
      hours: [{ weekday: WEDNESDAY, opensAt: "00:00", closesAt: "23:55" }],
      blocks: [],
      bookings: [],
      holds: [],
    });

    expect(estimateSlotReadSubrequests()).toBeLessThanOrEqual(10);
    expect(performance.now() - startedAt).toBeLessThan(50);
    expect(slots).toHaveLength(287);
  });
});

function slot(slotTime: string, remainingCapacity: number) {
  return expect.objectContaining({ date: DATE, slot: slotTime, remainingCapacity });
}
