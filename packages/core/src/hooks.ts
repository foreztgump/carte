import type { ContentHookEvent, KVAccess, PluginContext } from "emdash";

import { emitAllergenAuditIfChanged, hasAllergenAuditChange } from "./audit/log.js";
import { normalizeAllergenTags } from "./taxonomy/allergens.js";

const CARTE_COLLECTION_PREFIX = "carte_";
const MENU_ITEM_COLLECTION = "carte_menu_items";
const CACHE_KEYS = ["menu-feed", "schema-jsonld"] as const;
const HOURS_PATTERN = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

type WaitUntilContext = PluginContext & { waitUntil(promise: Promise<unknown>): void };

export const isCarteCollection = (collection: string): boolean =>
  collection.startsWith(CARTE_COLLECTION_PREFIX);

export const beforeSave = async (
  event: ContentHookEvent,
): Promise<Record<string, unknown> | void> => {
  if (!isCarteCollection(event.collection)) return;
  if (event.collection === MENU_ITEM_COLLECTION) return validateMenuItem(event.content);
  validateHoursField(event.content);
};

export const afterSave = async (event: ContentHookEvent, ctx: PluginContext): Promise<void> => {
  if (!isCarteCollection(event.collection)) return;
  getWaitUntil(ctx)(invalidateCarteCache(ctx.kv));
  if (hasAllergenAuditChange(event)) getWaitUntil(ctx)(emitAllergenAuditIfChanged(event, ctx));
};

const validateMenuItem = (content: Record<string, unknown>): Record<string, unknown> => {
  validatePrice(content.price);
  validateHoursField(content);

  return {
    ...content,
    allergens: normalizeAllergenTags(content.allergens),
  };
};

const PRICE_ERROR = "Menu item price must be a non-negative number.";

const validatePrice = (price: unknown): void => {
  if (price === undefined || price === null) return;
  if (typeof price === "number") {
    assertNonNegativeAmount(price);
    return;
  }
  if (isStructuredPrice(price)) {
    assertNonNegativeAmount(price.amount);
    return;
  }
  throw new Error(PRICE_ERROR);
};

const isStructuredPrice = (value: unknown): value is { amount: unknown; currency?: unknown } =>
  typeof value === "object" && value !== null && !Array.isArray(value) && "amount" in value;

const assertNonNegativeAmount = (amount: unknown): void => {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new Error(PRICE_ERROR);
  }
};

const validateHoursField = (content: Record<string, unknown>): void => {
  const hours = content.hours ?? content.availableHours;
  if (hours === undefined || hours === null) return;

  const values = Array.isArray(hours) ? hours : [hours];
  for (const value of values) validateHoursString(value);
};

const validateHoursString = (value: unknown): void => {
  if (typeof value !== "string" || !HOURS_PATTERN.test(value)) {
    throw new Error("Opening hours must use HH:mm-HH:mm format.");
  }
};

const invalidateCarteCache = async (kv: KVAccess): Promise<void> => {
  await Promise.all(CACHE_KEYS.map((key) => kv.delete(key)));
};

const getWaitUntil = (ctx: PluginContext): WaitUntilContext["waitUntil"] => {
  const waitUntil = (ctx as Partial<WaitUntilContext>).waitUntil;
  if (!waitUntil) throw new Error("ctx.waitUntil is required for Carte cache invalidation.");
  return waitUntil;
};
