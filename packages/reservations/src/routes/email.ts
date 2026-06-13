import type { ReservationRecord, ReservationRouteContext } from "./types.js";

type EmailKind = "received" | "confirmed" | "cancelled";

const EMAIL_SOURCE = "carte-reservations";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

interface EmailDedupRecord {
  sent: boolean;
  source: string;
  sentAt: string;
}

interface EmailParams {
  reservationId: string;
  reservation: ReservationRecord;
  kind: EmailKind;
}

const dedupKey = (params: EmailParams): string => `email:${params.reservationId}:${params.kind}`;

/**
 * Idempotent send for retryable flows (confirm/cancel): reads the dedup
 * record first so a re-dispatched task does not double-send.
 */
export async function sendReservationEmailOnce(
  ctx: ReservationRouteContext,
  params: EmailParams,
): Promise<void> {
  if (ctx.email === undefined) return;
  const key = dedupKey(params);
  const existing = await ctx.kv.get<EmailDedupRecord>(key);
  if (existing !== null && existing !== undefined && existing.sent === true) return;
  await deliverEmail(ctx, params, key);
}

/**
 * Send for a freshly created reservation (submit). The reservationId is minted
 * per request, so the dedup record cannot pre-exist; skipping the pre-read
 * saves a subrequest against the sandbox's 10-subrequest budget.
 */
export async function sendNewReservationEmail(
  ctx: ReservationRouteContext,
  params: EmailParams,
): Promise<void> {
  if (ctx.email === undefined) return;
  await deliverEmail(ctx, params, dedupKey(params));
}

async function deliverEmail(
  ctx: ReservationRouteContext,
  params: EmailParams,
  key: string,
): Promise<void> {
  if (ctx.email === undefined) return;
  await ctx.email.send(toMessage(params.reservation, params.kind));
  await ctx.kv.set(key, { sent: true, source: EMAIL_SOURCE, sentAt: new Date().toISOString() });
}

function toMessage(reservation: ReservationRecord, kind: EmailKind): EmailMessage {
  return {
    to: reservation.guestEmail,
    subject: `Reservation ${kind}`,
    text: buildEmailText(reservation, kind),
  };
}

function buildEmailText(reservation: ReservationRecord, kind: EmailKind): string {
  return [
    `Hello ${reservation.guestName},`,
    `Your reservation for ${reservation.partySize} on ${reservation.date} at ${reservation.slot} is ${kind}.`,
  ].join("\n\n");
}
