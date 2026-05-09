import { reserveCapacity } from "../capacity.js";
import { defer, getCapacityStore, getReservations, getTokenSecret } from "./context.js";
import { sendReservationEmailOnce } from "./email.js";
import { parseSubmitInput } from "./input.js";
import { createReservationToken } from "./tokens.js";
import type { ReservationRecord, ReservationRouteContext, RouteResult } from "./types.js";

export async function submitReservation(ctx: ReservationRouteContext): Promise<RouteResult> {
  const input = parseSubmitInput(ctx.input);
  if (input === null) return failure(400, "Invalid reservation request");
  const reservationId = crypto.randomUUID();
  const secret = await getTokenSecret(ctx);
  const reservation = await buildReservation(reservationId, input, secret);
  await reserveCapacity(getCapacityStore(ctx), { ...input, holdId: reservation.holdId });
  await getReservations(ctx).put(reservationId, reservation);
  defer(ctx, sendReservationEmailOnce(ctx, { reservationId, reservation, kind: "received" }));
  return { ok: true, status: 200, reservationId, confirmationToken: reservation.confirmationToken };
}

function failure(status: number, error: string): RouteResult {
  return { ok: false, status, error };
}

async function buildReservation(
  reservationId: string,
  input: {
    guestName: string;
    guestEmail: string;
    partySize: number;
    date: string;
    slot: string;
  },
  secret: string,
): Promise<ReservationRecord> {
  const holdId = crypto.randomUUID();
  return {
    ...input,
    status: "pending",
    holdId,
    confirmationToken: await createReservationToken(
      { reservationId, nonce: crypto.randomUUID() },
      secret,
    ),
    cancelToken: await createReservationToken(
      { reservationId, nonce: crypto.randomUUID() },
      secret,
    ),
    createdAt: new Date().toISOString(),
  };
}
