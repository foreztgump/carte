const MIN_PARTY_SIZE = 1;

export interface SubmitReservationInput {
  guestName: string;
  guestEmail: string;
  partySize: number;
  date: string;
  slot: string;
}

export interface TokenInput {
  token: string;
}

export function parseSubmitInput(input: unknown): SubmitReservationInput | null {
  if (!isRecord(input)) return null;
  const partySize = input.partySize;
  if (!isNonEmpty(input.guestName) || !isNonEmpty(input.guestEmail)) return null;
  if (!isNonEmpty(input.date) || !isNonEmpty(input.slot)) return null;
  if (typeof partySize !== "number" || !Number.isInteger(partySize)) return null;
  if (partySize < MIN_PARTY_SIZE) return null;
  return {
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    partySize,
    date: input.date,
    slot: input.slot,
  };
}

export function parseTokenInput(input: unknown): TokenInput | null {
  if (!isRecord(input) || !isNonEmpty(input.token)) return null;
  return { token: input.token };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
