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
  now?: Date;
};

type ContentListResult = Awaited<ReturnType<ContentAccess["list"]>>;
type ListedContentItem = ContentListResult["items"][number];
type ContentUpdate = NonNullable<ContentAccess["update"]>;

const restoreLocks = new Map<string, Promise<void>>();

export const eightySixMenuItem = async ({
  content,
  itemId,
  now = new Date(),
}: RestoreInput): Promise<{ ok: true; itemId: string; unavailableUntil: string }> => {
  const id = requireItemId(itemId);
  const update = requireContentUpdate(content);
  const unavailableUntil = nextSixAmLocal(now).toISOString();

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

const nextSixAmLocal = (now: Date): Date => {
  const restoreAt = new Date(now);
  restoreAt.setHours(
    RESTORE_HOUR_LOCAL,
    RESTORE_MINUTE_LOCAL,
    RESTORE_SECOND_LOCAL,
    RESTORE_MS_LOCAL,
  );
  if (restoreAt.getTime() <= now.getTime()) restoreAt.setDate(restoreAt.getDate() + 1);
  return restoreAt;
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
