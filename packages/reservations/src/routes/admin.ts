import { listActiveReservations } from "./context.js";
import type { ReservationRecord, ReservationRouteContext } from "./types.js";

interface BlockKitPage {
  type: "page";
  title: string;
  blocks: Array<Record<string, unknown>>;
}

export async function renderReservationsAdmin(ctx: ReservationRouteContext): Promise<BlockKitPage> {
  const reservations = await listActiveReservations(ctx);
  return {
    type: "page",
    title: "Reservations",
    blocks: [
      { type: "section", label: "Pending and confirmed reservations" },
      { type: "list", label: "Reservations", items: reservations.map(toListItem) },
    ],
  };
}

function toListItem(item: { id: string; data: ReservationRecord }): Record<string, string> {
  return {
    id: item.id,
    label: formatReservation(item.data),
    status: item.data.status,
  };
}

function formatReservation(reservation: ReservationRecord): string {
  return [
    reservation.guestName,
    reservation.guestEmail,
    String(reservation.partySize),
    reservation.date,
    reservation.slot,
    reservation.status,
  ].join(" · ");
}
