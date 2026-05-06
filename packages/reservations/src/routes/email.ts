import type { ReservationRecord, ReservationRouteContext } from "./types.js";

type EmailKind = "received" | "confirmed" | "cancelled";

const EMAIL_SOURCE = "carte-reservations";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendReservationEmailOnce(
  ctx: ReservationRouteContext,
  params: {
    reservationId: string;
    reservation: ReservationRecord;
    kind: EmailKind;
  },
): Promise<void> {
  if (ctx.email === undefined) return;
  const key = `email:${params.reservationId}:${params.kind}`;
  if ((await ctx.kv.get<boolean>(key)) === true) return;
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
