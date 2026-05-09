import type { ContentAccess } from "emdash";

const MENU_ITEM_COLLECTION = "carte_menu_items";
const MENU_ITEM_LIST_LIMIT = 100;
const RESTORE_HOUR_LOCAL = 6;
const RESTORE_MINUTE_LOCAL = 0;
const RESTORE_SECOND_LOCAL = 0;
const RESTORE_MS_LOCAL = 0;

type RestoreInput = {
  content: ContentAccess | undefined;
  itemId: unknown;
  timezone: string;
  now?: Date;
};

type ContentListResult = Awaited<ReturnType<ContentAccess["list"]>>;
type ListedContentItem = ContentListResult["items"][number];
type ContentUpdate = NonNullable<ContentAccess["update"]>;

const restoreLocks = new Map<string, Promise<void>>();

export const eightySixMenuItem = async ({
  content,
  itemId,
  timezone,
  now = new Date(),
}: RestoreInput): Promise<{ ok: true; itemId: string; unavailableUntil: string }> => {
  const id = requireItemId(itemId);
  const update = requireContentUpdate(content);
  const unavailableUntil = nextSixAmInZone(now, timezone).toISOString();

  await update(MENU_ITEM_COLLECTION, id, { available: false, unavailableUntil });
  return { ok: true, itemId: id, unavailableUntil };
};

export const listMenuItems = async (
  content: ContentAccess | undefined,
  now = new Date(),
): Promise<ContentListResult> => {
  if (!content) throw new Error("ctx.content is required to list menu items.");
  const result = await content.list(MENU_ITEM_COLLECTION, { limit: MENU_ITEM_LIST_LIMIT });
  const items = await Promise.all(result.items.map((item) => restoreIfExpired(content, item, now)));

  return { ...result, items };
};

export const shouldRestore = (item: ListedContentItem, now = new Date()): boolean => {
  if (item.data.available !== false) return false;
  const unavailableUntil = parseUnavailableUntil(item.data.unavailableUntil);
  if (!unavailableUntil) return false;
  return unavailableUntil.getTime() < now.getTime();
};

const restoreIfExpired = async (
  content: ContentAccess,
  item: ListedContentItem,
  now: Date,
): Promise<ListedContentItem> => {
  if (!shouldRestore(item, now)) return item;

  await restoreOnce(content, item);
  return { ...item, data: { ...item.data, available: true, unavailableUntil: null } };
};

const restoreOnce = async (content: ContentAccess, item: ListedContentItem): Promise<void> => {
  const key = restoreKey(item);
  const existing = restoreLocks.get(key);
  if (existing) return existing;

  const task = updateAvailability(content, item).finally(() => restoreLocks.delete(key));
  restoreLocks.set(key, task);
  return task;
};

const updateAvailability = async (
  content: ContentAccess,
  item: ListedContentItem,
): Promise<void> => {
  const update = requireContentUpdate(content);
  const restoredData = { ...item.data, available: true, unavailableUntil: null };
  await update(MENU_ITEM_COLLECTION, item.id, restoredData);
};

const nextSixAmInZone = (now: Date, timeZone: string): Date => {
  const wall = zonedWallClock(now, timeZone);
  const todaySixAm = zonedInstant({ year: wall.year, month: wall.month, day: wall.day }, timeZone);
  if (todaySixAm.getTime() > now.getTime()) return todaySixAm;
  return zonedInstant(nextDay(wall), timeZone);
};

type WallClock = { year: number; month: number; day: number };

const zonedWallClock = (instant: Date, timeZone: string): WallClock => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
};

const zonedInstant = (date: WallClock, timeZone: string): Date => {
  const utcGuess = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    RESTORE_HOUR_LOCAL,
    RESTORE_MINUTE_LOCAL,
    RESTORE_SECOND_LOCAL,
    RESTORE_MS_LOCAL,
  );
  const offsetMs = zoneOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offsetMs);
};

const zoneOffsetMs = (instant: Date, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second),
  );
  return asUtc - instant.getTime();
};

const nextDay = (date: WallClock): WallClock => {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
};

const parseUnavailableUntil = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const requireContentUpdate = (content: ContentAccess | undefined): ContentUpdate => {
  if (!content?.update) throw new Error("ctx.content.update is required to update menu items.");
  const update = content.update;
  return (collection, id, data) => update(collection, id, data);
};

const requireItemId = (itemId: unknown): string => {
  if (typeof itemId !== "string" || itemId.trim().length === 0) {
    throw new Error("itemId is required to 86 a menu item.");
  }
  return itemId;
};

const restoreKey = (item: ListedContentItem): string =>
  `${item.id}:${String(item.data.unavailableUntil)}`;
