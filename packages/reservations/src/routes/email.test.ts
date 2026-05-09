import { describe, expect, it, vi } from "vitest";

import { sendReservationEmailOnce } from "./email.js";
import type { ReservationRecord, ReservationRouteContext } from "./types.js";

describe("sendReservationEmailOnce", () => {
  it("sends the email exactly once even when the dedup key holds the stored object", async () => {
    const ctx = makeContext();
    const params = {
      reservationId: "res-1",
      reservation: makeReservation(),
      kind: "confirmed" as const,
    };

    await sendReservationEmailOnce(ctx, params);
    await sendReservationEmailOnce(ctx, params);

    expect(ctx.email.send).toHaveBeenCalledTimes(1);
  });
});

interface MockEmailCtx extends ReservationRouteContext {
  email: { send: ReturnType<typeof vi.fn> };
}

function makeContext(): MockEmailCtx {
  const kv = new Map<string, unknown>();
  return {
    input: {},
    request: new Request("https://example.com/"),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
    kv: {
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      set: vi.fn(async (key: string, value: unknown) => void kv.set(key, value)),
      delete: vi.fn(async () => undefined),
      list: vi.fn(async () => []),
    },
    email: { send: vi.fn(async () => undefined) },
    storage: {},
  } as unknown as MockEmailCtx;
}

function makeReservation(): ReservationRecord {
  return {
    guestName: "Guest",
    guestEmail: "guest@example.com",
    partySize: 2,
    date: "2026-05-06",
    slot: "18:00",
    status: "confirmed",
    holdId: "hold-1",
    confirmationToken: "ct",
    cancelToken: "xt",
    createdAt: "2026-05-01T00:00:00.000Z",
  };
}
