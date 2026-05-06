const CAPACITY_PREFIX = "capacity";
const HOLD_PREFIX = "hold";
const MIN_PARTY_SIZE = 1;

export const HOLD_TTL_SECONDS = 600;

export class CapacityExceededError extends Error {
  constructor(key: string) {
    super(`No capacity remaining for ${key}`);
    this.name = "CapacityExceededError";
  }
}

export interface CapacitySlot {
  date: string;
  slot: string;
}

export interface CapacityRequest extends CapacitySlot {
  holdId: string;
  partySize: number;
}

export interface ReservationHold extends CapacityRequest {
  capacityKey: string;
  holdKey: string;
}

export interface HoldWrite {
  key: string;
  ttlSeconds: number;
  hold: ReservationHold;
}

export interface AtomicCapacityStore {
  decrementCapacity(slot: CapacitySlot, amount: number): Promise<number>;
  restoreCapacity(slot: CapacitySlot, amount: number): Promise<number>;
  writeHold(hold: ReservationHold, ttlSeconds: number): Promise<void>;
  consumeHold(holdId: string): Promise<ReservationHold | null>;
}

type WaitUntil = (promise: Promise<unknown>) => void;

export const buildCapacityKey = (slot: CapacitySlot): string =>
  `${CAPACITY_PREFIX}:${slot.date}:${slot.slot}`;

export const buildHoldKey = (holdId: string): string => `${HOLD_PREFIX}:${holdId}`;

export async function reserveCapacity(
  store: AtomicCapacityStore,
  request: CapacityRequest,
): Promise<ReservationHold> {
  return createHold(store, request);
}

export async function createHold(
  store: AtomicCapacityStore,
  request: CapacityRequest,
): Promise<ReservationHold> {
  assertPartySize(request.partySize);
  const hold = toHold(request);
  await store.decrementCapacity(request, request.partySize);
  try {
    await store.writeHold(hold, HOLD_TTL_SECONDS);
    return hold;
  } catch (error) {
    await store.restoreCapacity(request, request.partySize);
    throw error;
  }
}

export function expireHold(store: AtomicCapacityStore, holdId: string, waitUntil: WaitUntil): void {
  waitUntil(restoreConsumedHold(store, holdId));
}

export function cancelHold(store: AtomicCapacityStore, holdId: string, waitUntil: WaitUntil): void {
  waitUntil(restoreConsumedHold(store, holdId));
}

export interface MemoryCapacityStore extends AtomicCapacityStore {
  readonly holdWrites: HoldWrite[];
  setCapacity(slot: CapacitySlot, capacity: number): Promise<void>;
  getCapacity(slot: CapacitySlot): Promise<number>;
}

export function createMemoryCapacityStore(): MemoryCapacityStore {
  return new QueuedMemoryCapacityStore();
}

class QueuedMemoryCapacityStore implements MemoryCapacityStore {
  readonly holdWrites: HoldWrite[] = [];
  private readonly capacities = new Map<string, number>();
  private readonly holds = new Map<string, ReservationHold>();
  private readonly queues = new Map<string, Promise<unknown>>();

  async setCapacity(slot: CapacitySlot, capacity: number): Promise<void> {
    this.capacities.set(buildCapacityKey(slot), capacity);
  }

  async getCapacity(slot: CapacitySlot): Promise<number> {
    return this.capacities.get(buildCapacityKey(slot)) ?? 0;
  }

  async decrementCapacity(slot: CapacitySlot, amount: number): Promise<number> {
    assertPartySize(amount);
    return this.enqueue(buildCapacityKey(slot), () => {
      const key = buildCapacityKey(slot);
      const nextValue = (this.capacities.get(key) ?? 0) - amount;
      if (nextValue < 0) {
        throw new CapacityExceededError(key);
      }
      this.capacities.set(key, nextValue);
      return nextValue;
    });
  }

  async restoreCapacity(slot: CapacitySlot, amount: number): Promise<number> {
    assertPartySize(amount);
    return this.enqueue(buildCapacityKey(slot), () => {
      const key = buildCapacityKey(slot);
      const nextValue = (this.capacities.get(key) ?? 0) + amount;
      this.capacities.set(key, nextValue);
      return nextValue;
    });
  }

  async writeHold(hold: ReservationHold, ttlSeconds: number): Promise<void> {
    this.holds.set(hold.holdKey, hold);
    this.holdWrites.push({ key: hold.holdKey, ttlSeconds, hold });
  }

  async consumeHold(holdId: string): Promise<ReservationHold | null> {
    const key = buildHoldKey(holdId);
    const hold = this.holds.get(key) ?? null;
    this.holds.delete(key);
    return hold;
  }

  private async enqueue<T>(key: string, operation: () => T): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();
    const current = previous.then(operation, operation);
    this.queues.set(
      key,
      current.then(
        () => undefined,
        () => undefined,
      ),
    );
    return current;
  }
}

function toHold(request: CapacityRequest): ReservationHold {
  return {
    ...request,
    capacityKey: buildCapacityKey(request),
    holdKey: buildHoldKey(request.holdId),
  };
}

async function restoreConsumedHold(store: AtomicCapacityStore, holdId: string): Promise<void> {
  const hold = await store.consumeHold(holdId);
  if (hold === null) {
    return;
  }
  await store.restoreCapacity(hold, hold.partySize);
}

function assertPartySize(partySize: number): void {
  if (!Number.isInteger(partySize) || partySize < MIN_PARTY_SIZE) {
    throw new RangeError("partySize must be a positive integer");
  }
}
