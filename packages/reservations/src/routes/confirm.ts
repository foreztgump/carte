import { defer, getReservations, getTokenSecret } from "./context.js";
import { sendReservationEmailOnce } from "./email.js";
import { parseTokenInput } from "./input.js";
import { verifyReservationToken } from "./tokens.js";
import type { ReservationRecord, ReservationRouteContext, RouteResult } from "./types.js";

export async function confirmReservation(ctx: ReservationRouteContext): Promise<RouteResult> {
  const reservation = await loadTokenReservation(ctx);
  if (reservation === null) return { ok: false, status: 400, error: "Invalid confirmation token" };
  const confirmed = { ...reservation.data, status: "confirmed" as const, confirmedAt: nowIso() };
  await getReservations(ctx).put(reservation.id, confirmed);
  defer(
    ctx,
    sendReservationEmailOnce(ctx, {
      reservationId: reservation.id,
      reservation: confirmed,
      kind: "confirmed",
    }),
  );
  return { ok: true, status: 200, reservationId: reservation.id };
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
