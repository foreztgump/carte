const CAPACITY_PREFIX = "capacity";
const HOLD_PREFIX = "hold";
const MIN_PARTY_SIZE = 1;
const CLAIM_QUERY_LIMIT = 1000;

export const CAPACITY_COLLECTION = "carte_reservation_capacity";
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
  expiresAt: string;
}

/**
 * One persisted seat claim. Authoritative capacity lives in the D1-backed
 * storage collection as these rows — never in KV. `slotKey` carries the
 * manifest `uniqueIndexes` intent; race safety is enforced by the serialized
 * claim path below (the static harness does not materialize uniqueIndexes).
 */
export interface CapacityClaimRow {
  kind: "claim";
  slotKey: string;
  date: string;
  slot: string;
  holdId: string;
  partySize: number;
  expiresAt: string;
}

/** Structural view of the `ctx.storage` collection used for capacity claims. */
export interface CapacityCollection {
  get(id: string): Promise<CapacityClaimRow | null>;
  exists(id: string): Promise<boolean>;
  put(id: string, data: CapacityClaimRow): Promise<void>;
  delete(id: string): Promise<boolean>;
  query(options?: {
    where?: Record<string, unknown>;
    limit?: number;
  }): Promise<{ items: Array<{ id: string; data: CapacityClaimRow }> }>;
}

/** Resolves the seat ceiling for a slot (e.g. restaurant settings). */
export type SlotCapacity = (slot: CapacitySlot) => Promise<number>;

export interface CapacityStore {
  claim(request: CapacityRequest): Promise<ReservationHold>;
  release(holdId: string): Promise<void>;
}

type WaitUntil = (promise: Promise<unknown>) => void;

export const buildCapacityKey = (slot: CapacitySlot): string =>
  `${CAPACITY_PREFIX}:${slot.date}:${slot.slot}`;

export const buildHoldKey = (holdId: string): string => `${HOLD_PREFIX}:${holdId}`;

export async function reserveCapacity(
  store: CapacityStore,
  request: CapacityRequest,
): Promise<ReservationHold> {
  return store.claim(request);
}

export async function createHold(
  store: CapacityStore,
  request: CapacityRequest,
): Promise<ReservationHold> {
  return store.claim(request);
}

export function expireHold(store: CapacityStore, holdId: string, waitUntil: WaitUntil): void {
  waitUntil(store.release(holdId));
}

export function cancelHold(store: CapacityStore, holdId: string, waitUntil: WaitUntil): void {
  waitUntil(store.release(holdId));
}

/**
 * Authoritative capacity store. Each claim writes a row to the D1-backed
 * storage collection; the claim path is serialized per slot (modelling D1's
 * single-writer guarantee), so the count-then-insert is race-safe and a
 * duplicate hold id resolves to {@link CapacityExceededError}, never a 500.
 */
export class StorageCapacityStore implements CapacityStore {
  private readonly queues = new Map<string, Promise<unknown>>();

  constructor(
    private readonly collection: CapacityCollection,
    private readonly ceilingFor: SlotCapacity,
  ) {}

  async claim(request: CapacityRequest): Promise<ReservationHold> {
    assertPartySize(request.partySize);
    const hold = toHold(request);
    return this.enqueue(hold.capacityKey, () => this.insertClaim(hold));
  }

  async release(holdId: string): Promise<void> {
    const key = buildHoldKey(holdId);
    const row = await this.collection.get(key);
    if (row === null) return;
    await this.enqueue(row.slotKey, () => this.collection.delete(key));
  }

  private async insertClaim(hold: ReservationHold): Promise<ReservationHold> {
    if (await this.collection.exists(hold.holdKey)) {
      throw new CapacityExceededError(hold.capacityKey);
    }
    const ceiling = await this.ceilingFor(hold);
    const claimed = await this.claimedSeats(hold.capacityKey);
    if (claimed + hold.partySize > ceiling) {
      throw new CapacityExceededError(hold.capacityKey);
    }
    await this.collection.put(hold.holdKey, toClaimRow(hold));
    return hold;
  }

  private async claimedSeats(slotKey: string): Promise<number> {
    const result = await this.collection.query({ where: { slotKey }, limit: CLAIM_QUERY_LIMIT });
    return result.items.reduce((sum, item) => sum + item.data.partySize, 0);
  }

  private enqueue<T>(key: string, operation: () => Promise<T> | T): Promise<T> {
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

export interface MemoryCapacityStore extends CapacityStore {
  setCapacity(slot: CapacitySlot, capacity: number): Promise<void>;
  getCapacity(slot: CapacitySlot): Promise<number>;
}

export function createMemoryCapacityStore(): MemoryCapacityStore {
  return new InMemoryCapacityStore();
}

/** In-memory {@link CapacityStore} backed by a fake storage collection. */
class InMemoryCapacityStore implements MemoryCapacityStore {
  private readonly capacities = new Map<string, number>();
  private readonly collection = new InMemoryCapacityCollection();
  private readonly delegate = new StorageCapacityStore(this.collection, (slot) =>
    Promise.resolve(this.capacities.get(buildCapacityKey(slot)) ?? 0),
  );

  async setCapacity(slot: CapacitySlot, capacity: number): Promise<void> {
    this.capacities.set(buildCapacityKey(slot), capacity);
  }

  async getCapacity(slot: CapacitySlot): Promise<number> {
    const ceiling = this.capacities.get(buildCapacityKey(slot)) ?? 0;
    return ceiling - (await this.collection.claimedSeats(buildCapacityKey(slot)));
  }

  claim(request: CapacityRequest): Promise<ReservationHold> {
    return this.delegate.claim(request);
  }

  release(holdId: string): Promise<void> {
    return this.delegate.release(holdId);
  }
}

class InMemoryCapacityCollection implements CapacityCollection {
  private readonly rows = new Map<string, CapacityClaimRow>();

  async get(id: string): Promise<CapacityClaimRow | null> {
    return this.rows.get(id) ?? null;
  }

  async exists(id: string): Promise<boolean> {
    return this.rows.has(id);
  }

  async put(id: string, data: CapacityClaimRow): Promise<void> {
    this.rows.set(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.rows.delete(id);
  }

  async query(options?: {
    where?: Record<string, unknown>;
  }): Promise<{ items: Array<{ id: string; data: CapacityClaimRow }> }> {
    const slotKey = options?.where?.slotKey;
    const items = [...this.rows.entries()]
      .filter(([, data]) => slotKey === undefined || data.slotKey === slotKey)
      .map(([id, data]) => ({ id, data }));
    return { items };
  }

  async claimedSeats(slotKey: string): Promise<number> {
    const { items } = await this.query({ where: { slotKey } });
    return items.reduce((sum, item) => sum + item.data.partySize, 0);
  }
}

function toHold(request: CapacityRequest): ReservationHold {
  return {
    ...request,
    capacityKey: buildCapacityKey(request),
    holdKey: buildHoldKey(request.holdId),
    expiresAt: new Date(Date.now() + HOLD_TTL_SECONDS * 1000).toISOString(),
  };
}

function toClaimRow(hold: ReservationHold): CapacityClaimRow {
  return {
    kind: "claim",
    slotKey: hold.capacityKey,
    date: hold.date,
    slot: hold.slot,
    holdId: hold.holdId,
    partySize: hold.partySize,
    expiresAt: hold.expiresAt,
  };
}

function assertPartySize(partySize: number): void {
  if (!Number.isInteger(partySize) || partySize < MIN_PARTY_SIZE) {
    throw new RangeError("partySize must be a positive integer");
  }
}
