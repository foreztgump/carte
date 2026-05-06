// Read-time availability is pure CPU work after bounded reads:
// hours (1), reservation blocks (1), current bookings (1), active holds (1).
// No slot rows are persisted, leaving 6 of 10 sandbox subrequests as headroom.

const MINUTES_PER_HOUR = 60;
const SLOT_FETCH_SUBREQUESTS = 4;
const FIRST_WEEKDAY = 0;
const LAST_WEEKDAY = 6;
const MIN_SLOT_MINUTES = 1;
const MIN_CAPACITY = 1;

export interface SlotSettings {
  capacityPerSlot: number;
  slotMinutes: number;
  leadMinutes: number;
}

export interface OpeningWindow {
  weekday: number;
  opensAt: string;
  closesAt: string;
}

export interface ReservationBlock {
  startsAt: string;
  endsAt: string;
  capacityOverride?: number;
}

export interface SlotBooking {
  date: string;
  slot: string;
  partySize: number;
  status: "pending" | "confirmed" | "cancelled";
}

export interface ActiveSlotHold {
  date: string;
  slot: string;
  partySize: number;
  expiresAt: string;
}

export interface AvailableSlot {
  date: string;
  slot: string;
  startsAt: string;
  capacity: number;
  bookedSeats: number;
  heldSeats: number;
  remainingCapacity: number;
}

export interface SlotComputationInput {
  date: string;
  now: string;
  settings: SlotSettings;
  hours: OpeningWindow[];
  blocks: ReservationBlock[];
  bookings: SlotBooking[];
  holds: ActiveSlotHold[];
}

interface CandidateSlot {
  date: string;
  slot: string;
  startsAt: Date;
  endsAt: Date;
}

export function computeAvailableSlots(input: SlotComputationInput): AvailableSlot[] {
  assertSettings(input.settings);
  const now = new Date(input.now);
  const minStartsAt = addMinutes(now, input.settings.leadMinutes);
  return buildCandidateSlots(input)
    .filter((candidate) => candidate.startsAt >= minStartsAt)
    .map((candidate) => toAvailableSlot(candidate, input, now))
    .filter((slot): slot is AvailableSlot => slot !== null);
}

export function estimateSlotReadSubrequests(): number {
  return SLOT_FETCH_SUBREQUESTS;
}

function buildCandidateSlots(input: SlotComputationInput): CandidateSlot[] {
  return input.hours.flatMap((window) =>
    isWindowForDate(window, input.date) ? buildWindowSlots(input.date, window, input.settings) : [],
  );
}

function buildWindowSlots(
  date: string,
  window: OpeningWindow,
  settings: SlotSettings,
): CandidateSlot[] {
  const slots: CandidateSlot[] = [];
  const closeMinute = parseMinuteOfDay(window.closesAt);
  for (
    let minute = parseMinuteOfDay(window.opensAt);
    minute < closeMinute;
    minute += settings.slotMinutes
  ) {
    const slot = formatMinuteOfDay(minute);
    slots.push({
      date,
      slot,
      startsAt: atDateMinute(date, minute),
      endsAt: atDateMinute(date, minute + settings.slotMinutes),
    });
  }
  return slots;
}

function toAvailableSlot(
  candidate: CandidateSlot,
  input: SlotComputationInput,
  now: Date,
): AvailableSlot | null {
  const capacity = resolveCapacity(candidate, input);
  if (capacity === null) return null;
  const bookedSeats = sumBookings(input.bookings, candidate);
  const heldSeats = sumActiveHolds(input.holds, candidate, now);
  const remainingCapacity = capacity - bookedSeats - heldSeats;
  if (remainingCapacity < MIN_CAPACITY) return null;
  return toSlotResult(candidate, capacity, bookedSeats, heldSeats, remainingCapacity);
}

function resolveCapacity(candidate: CandidateSlot, input: SlotComputationInput): number | null {
  let capacity = input.settings.capacityPerSlot;
  for (const block of input.blocks.filter((item) => overlaps(candidate, item))) {
    if (block.capacityOverride === undefined) return null;
    capacity = Math.min(capacity, block.capacityOverride);
  }
  return capacity;
}

function sumBookings(bookings: SlotBooking[], candidate: CandidateSlot): number {
  return bookings
    .filter((booking) => booking.date === candidate.date)
    .filter((booking) => booking.slot === candidate.slot)
    .filter((booking) => booking.status !== "cancelled")
    .reduce((sum, booking) => sum + booking.partySize, 0);
}

function sumActiveHolds(holds: ActiveSlotHold[], candidate: CandidateSlot, now: Date): number {
  return holds
    .filter((hold) => hold.date === candidate.date)
    .filter((hold) => hold.slot === candidate.slot)
    .filter((hold) => new Date(hold.expiresAt) > now)
    .reduce((sum, hold) => sum + hold.partySize, 0);
}

function toSlotResult(
  candidate: CandidateSlot,
  capacity: number,
  bookedSeats: number,
  heldSeats: number,
  remainingCapacity: number,
): AvailableSlot {
  return {
    date: candidate.date,
    slot: candidate.slot,
    startsAt: candidate.startsAt.toISOString(),
    capacity,
    bookedSeats,
    heldSeats,
    remainingCapacity,
  };
}

function overlaps(candidate: CandidateSlot, block: ReservationBlock): boolean {
  const startsAt = new Date(block.startsAt);
  const endsAt = new Date(block.endsAt);
  return startsAt < candidate.endsAt && candidate.startsAt < endsAt;
}

function isWindowForDate(window: OpeningWindow, date: string): boolean {
  if (window.weekday < FIRST_WEEKDAY || window.weekday > LAST_WEEKDAY) return false;
  return atDateMinute(date, 0).getUTCDay() === window.weekday;
}

function parseMinuteOfDay(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (hours === undefined || minutes === undefined) throw new RangeError("Invalid time");
  return hours * MINUTES_PER_HOUR + minutes;
}

function formatMinuteOfDay(value: number): string {
  const hours = Math.floor(value / MINUTES_PER_HOUR)
    .toString()
    .padStart(2, "0");
  const minutes = (value % MINUTES_PER_HOUR).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function atDateMinute(date: string, minute: number): Date {
  return new Date(`${date}T${formatMinuteOfDay(minute)}:00.000Z`);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTES_PER_HOUR * 1000);
}

function assertSettings(settings: SlotSettings): void {
  if (settings.capacityPerSlot < MIN_CAPACITY) throw new RangeError("capacityPerSlot too small");
  if (settings.slotMinutes < MIN_SLOT_MINUTES) throw new RangeError("slotMinutes too small");
}
