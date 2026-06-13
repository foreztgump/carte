import type { RouteContext } from "emdash";

import type { CapacityStore } from "../capacity.js";

export const RESERVATION_COLLECTION = "carte_reservations";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export interface ReservationRecord {
  guestName: string;
  guestEmail: string;
  partySize: number;
  date: string;
  slot: string;
  status: ReservationStatus;
  holdId: string;
  confirmationToken: string;
  cancelToken: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

export interface ReservationRouteContext<TInput = unknown> extends RouteContext<TInput> {
  capacityStore?: CapacityStore;
  waitUntil?: (promise: Promise<unknown>) => void;
}

export interface RouteResult {
  ok: boolean;
  status: number;
  error?: string;
  reservationId?: string;
  confirmationToken?: string;
  cancelToken?: string;
}

export interface ReservationCollection {
  get(id: string): Promise<ReservationRecord | null>;
  put(id: string, data: ReservationRecord): Promise<void>;
  query(options?: unknown): Promise<{ items: Array<{ id: string; data: ReservationRecord }> }>;
}
