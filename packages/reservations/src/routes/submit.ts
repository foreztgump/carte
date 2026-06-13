import { CapacityExceededError, reserveCapacity } from "../capacity.js";
import { defer, getCapacityStore, getReservations, getTokenSecret } from "./context.js";
import { sendNewReservationEmail } from "./email.js";
import { parseSubmitInput } from "./input.js";
import { createReservationToken } from "./tokens.js";
import type { ReservationRecord, ReservationRouteContext, RouteResult } from "./types.js";

const SLOT_FULL_STATUS = 409;

export async function submitReservation(ctx: ReservationRouteContext): Promise<RouteResult> {
  const input = parseSubmitInput(ctx.input);
  if (input === null) return failure(400, "Invalid reservation request");
  const reservationId = crypto.randomUUID();
  const secret = await getTokenSecret(ctx);
  const reservation = await buildReservation(reservationId, input, secret);
  const claimed = await claimSlot(ctx, { ...input, holdId: reservation.holdId });
  if (!claimed) return failure(SLOT_FULL_STATUS, "Selected time is fully booked");
  await getReservations(ctx).put(reservationId, reservation);
  defer(ctx, sendNewReservationEmail(ctx, { reservationId, reservation, kind: "received" }));
  return { ok: true, status: 200, reservationId, confirmationToken: reservation.confirmationToken };
}

async function claimSlot(
  ctx: ReservationRouteContext,
  request: { date: string; slot: string; partySize: number; holdId: string },
): Promise<boolean> {
  try {
    await reserveCapacity(getCapacityStore(ctx), request);
    return true;
  } catch (error) {
    if (error instanceof CapacityExceededError) return false;
    throw error;
  }
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
