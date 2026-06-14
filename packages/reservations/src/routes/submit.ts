import { CapacityExceededError, reserveCapacity } from "../capacity.js";
import { defer, getCapacityStore, getReservations, getTokenSecret } from "./context.js";
import { sendNewReservationEmail } from "./email.js";
import { parseSubmitInput } from "./input.js";
import { createReservationToken } from "./tokens.js";
import type { ReservationRecord, ReservationRouteContext, RouteResult } from "./types.js";

const SLOT_FULL_STATUS = 409;

/**
 * Subrequest audit (worst-case accepted submit, against the 10-subrequest
 * Cloudflare sandbox cap): rate-limit kv.get + kv.set (2, in plugin.ts) +
 * tokenSecret kv.get (1) + capacityPerSlot kv.get (1) + block-override query
 * (1) + claim survey query (1) + claim put (1) + reservations put (1) +
 * deferred email.send (1) = 9, leaving 1 subrequest of headroom. Two ops were
 * taken OFF this critical path per AGENTS.md "do not try to fit the ceiling":
 * (a) the expiry-sweep delete is gone — the accepted claim relies on the
 * survey's lazy expiry exclusion and never deletes a row (rows are removed by
 * their own release); (b) the "received" email dedup kv.set is gone — that key
 * is never read (confirm/cancel use distinct kinds), so the write was dead.
 * Together these offset the new block-override query so threading per-slot
 * overrides into the ceiling does not erode the budget.
 */
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
