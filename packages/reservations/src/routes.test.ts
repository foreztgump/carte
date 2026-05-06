import type { RouteContext } from "emdash";
import { describe, expect, it, vi } from "vitest";

import { createMemoryCapacityStore } from "./capacity.js";
import factory from "./index.js";
import { createReservationToken } from "./routes/tokens.js";

const TOKEN_SECRET = "test-token-secret";
const SLOT = { date: "2026-05-06", slot: "18:00" } as const;

describe("reservation public routes", () => {
  it("submit creates a pending reservation, decrements capacity, and queues received email", async () => {
    const context = await createRouteContext();
    await context.capacityStore.setCapacity(SLOT, 4);

    const result = await factory().routes.submit.handler(context);

    expect(result).toMatchObject({ ok: true, status: 200, reservationId: expect.any(String) });
    expect(context.reservations).toHaveLength(1);
    expect(context.reservations[0]?.data).toMatchObject({ status: "pending", partySize: 2 });
    await expect(context.capacityStore.getCapacity(SLOT)).resolves.toBe(2);
    expect(context.waitUntil).toHaveBeenCalledTimes(1);
    await expect(context.waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
    expect(context.email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.com",
        subject: expect.stringContaining("received"),
      }),
    );
  });

  it("confirm validates the token, flips state, and queues confirmation email", async () => {
    const context = await createRouteContext();
    const reservationId = await context.putReservation({ status: "pending" });
    const token = await createReservationToken(
      { reservationId, nonce: "confirm-nonce" },
      TOKEN_SECRET,
    );
    context.input = { token };

    const result = await factory().routes.confirm.handler(context);

    expect(result).toMatchObject({ ok: true, status: 200, reservationId });
    expect(context.reservations[0]?.data.status).toBe("confirmed");
    await expect(context.waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
    expect(context.email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.com",
        subject: expect.stringContaining("confirmed"),
      }),
    );
  });

  it("rejects invalid confirmation tokens", async () => {
    const context = await createRouteContext();
    context.input = { token: "not-a-valid-token" };

    await expect(factory().routes.confirm.handler(context)).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("cancel-by-token flips state, restores capacity, and queues cancellation email", async () => {
    const context = await createRouteContext();
    await context.capacityStore.setCapacity(SLOT, 0);
    const reservationId = await context.putReservation({
      status: "confirmed",
      holdId: "cancel-hold",
    });
    const token = await createReservationToken(
      { reservationId, nonce: "cancel-nonce" },
      TOKEN_SECRET,
    );
    context.input = { token };

    const result = await factory().routes["cancel-by-token"].handler(context);

    expect(result).toMatchObject({ ok: true, status: 200, reservationId });
    expect(context.reservations[0]?.data.status).toBe("cancelled");
    await expect(context.waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined();
    await expect(context.capacityStore.getCapacity(SLOT)).resolves.toBe(2);
    expect(context.email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.com",
        subject: expect.stringContaining("cancelled"),
      }),
    );
  });
});

describe("reservation admin route", () => {
  it("lists pending and confirmed reservations with canonical Block Kit primitives", async () => {
    const context = await createRouteContext();
    await context.putReservation({ status: "pending", guestName: "Pending Guest" });
    await context.putReservation({ status: "confirmed", guestName: "Confirmed Guest" });
    await context.putReservation({ status: "cancelled", guestName: "Cancelled Guest" });

    const result = await factory().routes.admin.handler(context);
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({ type: "page", title: "Reservations" });
    expect(serialized).toContain("Pending Guest");
    expect(serialized).toContain("Confirmed Guest");
    expect(serialized).not.toContain("Cancelled Guest");
    expect(serialized).not.toContain('"text"');
    expect(serialized).not.toContain('"stats"');
    expect(serialized).not.toContain("**");
  });
});

async function createRouteContext(): Promise<TestRouteContext> {
  const capacityStore = createMemoryCapacityStore();
  const reservations: StoredReservation[] = [];
  const kv = new Map<string, unknown>([["settings:tokenSecret", TOKEN_SECRET]]);
  const context = {
    input: { ...SLOT, guestName: "Guest", guestEmail: "guest@example.com", partySize: 2 },
    request: new Request("https://example.com/_emdash/api/plugins/carte-reservations/submit"),
    requestMeta: { ip: "203.0.113.10", userAgent: null, referer: null, geo: null },
    kv: {
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      set: vi.fn(async (key: string, value: unknown) => void kv.set(key, value)),
      delete: vi.fn(async (key: string) => kv.delete(key)),
      list: vi.fn(async () => []),
    },
    email: { send: vi.fn(async () => undefined) },
    waitUntil: vi.fn(),
    capacityStore,
    reservations,
    putReservation: async (data: Partial<ReservationData>) => {
      const id = `reservation-${reservations.length + 1}`;
      reservations.push({ id, data: { ...baseReservationData(), ...data } });
      return id;
    },
    storage: {
      carte_reservations: {
        get: vi.fn(async (id: string) => reservations.find((item) => item.id === id)?.data ?? null),
        put: vi.fn(async (id: string, data: ReservationData) => {
          const existing = reservations.find((item) => item.id === id);
          if (existing) existing.data = data;
          else reservations.push({ id, data });
        }),
        query: vi.fn(async () => ({ items: reservations, hasMore: false })),
      },
    },
  };
  return context as unknown as TestRouteContext;
}

function baseReservationData(): ReservationData {
  return {
    guestName: "Guest",
    guestEmail: "guest@example.com",
    partySize: 2,
    date: SLOT.date,
    slot: SLOT.slot,
    status: "pending",
    holdId: "cancel-hold",
  };
}

interface ReservationData {
  guestName: string;
  guestEmail: string;
  partySize: number;
  date: string;
  slot: string;
  status: string;
  holdId: string;
}

interface StoredReservation {
  id: string;
  data: ReservationData;
}

interface TestRouteContext extends RouteContext {
  input: Record<string, unknown>;
  waitUntil: ReturnType<typeof vi.fn>;
  email: { send: ReturnType<typeof vi.fn> };
  capacityStore: ReturnType<typeof createMemoryCapacityStore>;
  reservations: StoredReservation[];
  putReservation(data: Partial<ReservationData>): Promise<string>;
}
