const CAPACITY_PREFIX = "capacity";
const HOLD_PREFIX = "hold";
const MIN_PARTY_SIZE = 1;
const CLAIM_QUERY_LIMIT = 1000;

/**
 * Per-slot claim serialization, scoped to MODULE state so it survives across
 * the fresh {@link StorageCapacityStore} instances that the route layer
 * constructs per request (routes/context.ts). workerd reuses a plugin isolate
 * across concurrent requests (VERIFIED-PLATFORM §9), so a module-level queue
 * mutually excludes the count-then-insert sequence for same-isolate
 * concurrency. RESIDUAL RISK: Cloudflare may run multiple isolates for one
 * plugin; in that topology no in-process scheme serializes cross-isolate
 * claims. The manifest `uniqueIndexes: ["slotKey"]` entry is the declared
 * future backstop for that case (not enforced on the static harness path —
 * VERIFIED-PLATFORM §1).
 */
const slotClaimQueues = new Map<string, Promise<unknown>>();

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
 * manifest `uniqueIndexes` intent: it is the declared future backstop for
 * cross-isolate races, not enforced on the static harness path
 * (VERIFIED-PLATFORM §1). Same-isolate race safety comes from the
 * module-scoped per-slot serialization below (VERIFIED-PLATFORM §9).
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

/** Survey of one slot's persisted claims: live seat total, duplicate flag, expired rows. */
interface SlotSurvey {
  duplicate: boolean;
  activeSeats: number;
  expiredKeys: string[];
}

/** Max expired claim rows swept per claim — bounds the per-invocation subrequest cost. */
const MAX_EXPIRY_SWEEP = 1;

const isExpired = (row: CapacityClaimRow, now: number): boolean =>
  new Date(row.expiresAt).getTime() <= now;

/**
 * Authoritative capacity store. Each claim writes a row to the D1-backed
 * storage collection. The claim path is serialized per slot via the
 * module-scoped {@link slotClaimQueues} (NOT per-instance), so the
 * survey-then-insert sequence is mutually excluded across the fresh store
 * instances the route layer builds per request.
 *
 * GUARANTEE: in-isolate serialization — concurrent claims that share the
 * plugin isolate (workerd reuses one; VERIFIED-PLATFORM §9) never oversell,
 * and a duplicate hold id resolves to {@link CapacityExceededError}, never a
 * 500. RESIDUAL RISK: if Cloudflare runs multiple isolates for this plugin,
 * cross-isolate claims are not serialized; the manifest
 * `uniqueIndexes: ["slotKey"]` is the declared future backstop (not enforced
 * on the static harness path — VERIFIED-PLATFORM §1).
 */
export class StorageCapacityStore implements CapacityStore {
  constructor(
    private readonly collection: CapacityCollection,
    private readonly ceilingFor: SlotCapacity,
  ) {}

  async claim(request: CapacityRequest): Promise<ReservationHold> {
    assertPartySize(request.partySize);
    const hold = toHold(request);
    return enqueueForSlot(hold.capacityKey, () => this.insertClaim(hold));
  }

  async release(holdId: string): Promise<void> {
    const key = buildHoldKey(holdId);
    const row = await this.collection.get(key);
    if (row === null) return;
    await enqueueForSlot(row.slotKey, () => this.collection.delete(key));
  }

  private async insertClaim(hold: ReservationHold): Promise<ReservationHold> {
    const survey = await this.surveySlot(hold.capacityKey, hold.holdKey);
    if (survey.duplicate) throw new CapacityExceededError(hold.capacityKey);
    const ceiling = await this.ceilingFor(hold);
    if (survey.activeSeats + hold.partySize > ceiling) {
      throw new CapacityExceededError(hold.capacityKey);
    }
    await this.collection.put(hold.holdKey, toClaimRow(hold));
    await this.sweepExpired(survey.expiredKeys);
    return hold;
  }

  /** Single query that derives the live seat total, duplicate flag, and expired rows. */
  private async surveySlot(slotKey: string, holdKey: string): Promise<SlotSurvey> {
    const result = await this.collection.query({ where: { slotKey }, limit: CLAIM_QUERY_LIMIT });
    const now = Date.now();
    const survey: SlotSurvey = { duplicate: false, activeSeats: 0, expiredKeys: [] };
    for (const { id, data } of result.items) {
      if (isExpired(data, now)) survey.expiredKeys.push(id);
      else if (id === holdKey) survey.duplicate = true;
      else survey.activeSeats += data.partySize;
    }
    return survey;
  }

  private async sweepExpired(expiredKeys: string[]): Promise<void> {
    for (const key of expiredKeys.slice(0, MAX_EXPIRY_SWEEP)) {
      await this.collection.delete(key);
    }
  }
}

function enqueueForSlot<T>(key: string, operation: () => Promise<T> | T): Promise<T> {
  const previous = slotClaimQueues.get(key) ?? Promise.resolve();
  const current = previous.then(operation, operation);
  const settled = current.then(
    () => undefined,
    () => undefined,
  );
  slotClaimQueues.set(key, settled);
  void settled.then(() => {
    if (slotClaimQueues.get(key) === settled) slotClaimQueues.delete(key);
  });
  return current;
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
