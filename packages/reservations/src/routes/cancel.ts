import { defer, getCapacityStore, getReservations, getTokenSecret } from "./context.js";
import { sendReservationEmailOnce } from "./email.js";
import { parseTokenInput } from "./input.js";
import { verifyReservationToken } from "./tokens.js";
import type { ReservationRecord, ReservationRouteContext, RouteResult } from "./types.js";

export async function cancelReservationByToken(ctx: ReservationRouteContext): Promise<RouteResult> {
  const reservation = await loadTokenReservation(ctx);
  if (reservation === null) return { ok: false, status: 400, error: "Invalid cancellation token" };
  if (reservation.data.status === "cancelled") {
    return { ok: true, status: 200, reservationId: reservation.id };
  }
  const cancelled = { ...reservation.data, status: "cancelled" as const, cancelledAt: nowIso() };
  await getReservations(ctx).put(reservation.id, cancelled);
  defer(ctx, restoreCapacityAndEmail(ctx, reservation.id, cancelled));
  return { ok: true, status: 200, reservationId: reservation.id };
}

async function restoreCapacityAndEmail(
  ctx: ReservationRouteContext,
  reservationId: string,
  reservation: ReservationRecord,
): Promise<void> {
  await restoreCapacity(ctx, reservation);
  await sendReservationEmailOnce(ctx, { reservationId, reservation, kind: "cancelled" });
}

async function restoreCapacity(
  ctx: ReservationRouteContext,
  reservation: ReservationRecord,
): Promise<void> {
  await getCapacityStore(ctx).release(reservation.holdId);
}

async function loadTokenReservation(
  ctx: ReservationRouteContext,
): Promise<{ id: string; data: ReservationRecord } | null> {
  const input = parseTokenInput(ctx.input);
  if (input === null) return null;
  const payload = await verifyReservationToken(input.token, await getTokenSecret(ctx));
  if (payload === null) return null;
  const data = await getReservations(ctx).get(payload.reservationId);
  if (data === null) return null;
  return { id: payload.reservationId, data };
}

function nowIso(): string {
  return new Date().toISOString();
}
