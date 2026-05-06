import { normalizeAllergenTags } from "../taxonomy/allergens.js";

import type { ContentAccess, ContentHookEvent, PluginContext } from "emdash";

const AUDIT_COLLECTION = "carte_audit_log";
const MENU_ITEM_COLLECTION = "carte_menu_items";
const ALLERGEN_ACTION = "menu_item_allergens_changed";
const SYSTEM_ACTOR = "system";

type AllergenEvent = ContentHookEvent & {
  previousContent?: Record<string, unknown>;
};
type ActorContext = PluginContext & {
  actor?: { id?: string; email?: string };
  user?: { id?: string; email?: string };
};

export const emitAllergenAuditIfChanged = async (
  event: ContentHookEvent,
  ctx: PluginContext,
): Promise<void> => {
  if (!hasAllergenAuditChange(event)) return;
  const before = getBeforeAllergens(event as AllergenEvent);
  const after = normalizeAllergenTags(event.content.allergens) ?? [];
  await writeAuditEntry(ctx, buildAuditEntry(event, ctx, before, after));
};

export const hasAllergenAuditChange = (event: ContentHookEvent): boolean => {
  if (event.collection !== MENU_ITEM_COLLECTION) return false;
  const before = getBeforeAllergens(event as AllergenEvent);
  const after = normalizeAllergenTags(event.content.allergens) ?? [];
  return !sameAllergens(before, after);
};

const getBeforeAllergens = (event: AllergenEvent): string[] => {
  if (event.isNew && !event.previousContent) return [];
  return normalizeAllergenTags(event.previousContent?.allergens) ?? [];
};

const sameAllergens = (before: string[], after: string[]): boolean =>
  before.length === after.length && before.every((tag, index) => tag === after[index]);

const buildAuditEntry = (
  event: ContentHookEvent,
  ctx: PluginContext,
  before: string[],
  after: string[],
): Record<string, unknown> => ({
  action: ALLERGEN_ACTION,
  actor: readActor(ctx),
  before,
  after,
  targetCollection: MENU_ITEM_COLLECTION,
  targetId: readTargetId(event.content),
  timestamp: new Date().toISOString(),
});

const readActor = (ctx: PluginContext): string => {
  const actor = ctx as ActorContext;
  return (
    actor.actor?.id ?? actor.actor?.email ?? actor.user?.id ?? actor.user?.email ?? SYSTEM_ACTOR
  );
};

const readTargetId = (content: Record<string, unknown>): string | undefined =>
  typeof content.id === "string" ? content.id : undefined;

const writeAuditEntry = async (
  ctx: PluginContext,
  entry: Record<string, unknown>,
): Promise<void> => {
  const create = (ctx.content as ContentAccess | undefined)?.create;
  if (!create) throw new Error("ctx.content.create is required for allergen audit logging.");
  await create(AUDIT_COLLECTION, entry);
};
