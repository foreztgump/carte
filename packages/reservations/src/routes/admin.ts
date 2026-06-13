import { listActiveReservations } from "./context.js";
import type { ReservationRecord, ReservationRouteContext } from "./types.js";

interface BlockKitPage {
  type: "page";
  plugin: "carte-reservations";
  title: string;
  blocks: Block[];
}

type Block = SectionBlock | StatsBlock;

type SectionBlock = {
  type: "section";
  block_id: string;
  text: string;
};

type StatsBlock = {
  type: "stats";
  block_id: string;
  items: StatItem[];
};

type StatItem = { label: string; value: string | number };

export async function renderReservationsAdmin(ctx: ReservationRouteContext): Promise<BlockKitPage> {
  const reservations = await listActiveReservations(ctx);
  return reservationsPage("Reservations", reservations);
}

export async function renderReservationBlocksAdmin(
  ctx: ReservationRouteContext,
): Promise<BlockKitPage> {
  const reservations = await listActiveReservations(ctx);
  return reservationsPage("Closures", reservations);
}

function reservationsPage(
  title: string,
  reservations: Array<{ id: string; data: ReservationRecord }>,
): BlockKitPage {
  return {
    type: "page",
    plugin: "carte-reservations",
    title,
    blocks: [
      {
        type: "section",
        block_id: "reservations-intro",
        text: "Pending and confirmed reservations.",
      },
      {
        type: "stats",
        block_id: "reservations-summary",
        items: [
          { label: "Pending", value: countByStatus(reservations, "pending") },
          { label: "Confirmed", value: countByStatus(reservations, "confirmed") },
        ],
      },
      ...reservations.map(toReservationSection),
    ],
  };
}

function toReservationSection(item: { id: string; data: ReservationRecord }): SectionBlock {
  return {
    type: "section",
    block_id: `reservation-${item.id}`,
    text: formatReservation(item.data),
  };
}

function formatReservation(reservation: ReservationRecord): string {
  return [
    reservation.guestName,
    reservation.guestEmail,
    String(reservation.partySize),
    `${reservation.date} ${reservation.slot}`,
    reservation.status,
  ].join(" · ");
}

function countByStatus(
  reservations: Array<{ data: ReservationRecord }>,
  status: ReservationRecord["status"],
): number {
  return reservations.filter((item) => item.data.status === status).length;
}
