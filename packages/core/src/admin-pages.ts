import type { ContentAccess, PluginRoute, RouteContext } from "emdash";

const PLUGIN_ID = "carte-core";
const MENU_COLLECTION = "carte_menus";
const MENU_SECTION_COLLECTION = "carte_menu_sections";
const MENU_ITEM_COLLECTION = "carte_menu_items";
const RESTAURANT_COLLECTION = "carte_restaurants";
const HOURS_COLLECTION = "carte_hours";
const CLOSURES_COLLECTION = "carte_closures";
const SETTINGS_COLLECTION = "carte_settings";
const LIST_LIMIT = 20;

type BlockKitPage = {
  type: "page";
  plugin: typeof PLUGIN_ID;
  title: string;
  blocks: Block[];
};

type Block = SectionBlock | StatsBlock | ActionsBlock | DividerBlock;
type ButtonStyle = "primary" | "secondary" | "danger";

type Button = {
  type: "button";
  action_id: string;
  label: string;
  style?: ButtonStyle;
};

type ButtonInput = Omit<Button, "type">;

type SectionBlock = { type: "section"; block_id: string; text: string };
type DividerBlock = { type: "divider"; block_id: string };
type ActionsBlock = { type: "actions"; block_id: string; elements: Button[] };
type StatsBlock = { type: "stats"; block_id: string; items: MetricItem[] };
type MetricItem = { label: string; value: string };

type AdminSummary = {
  menus: number;
  sections: number;
  items: number;
  restaurants: number;
  hours: number;
  closures: number;
  settings: number;
};

type AdminPageKey = keyof typeof ADMIN_PAGE_BUILDERS;

const ADMIN_PAGE_PATHS = {
  "/carte": "menus",
  "/carte/restaurant": "restaurant",
  "/carte/hours": "hours",
  "/carte/settings": "settings",
} as const satisfies Record<string, AdminPageKey>;

export const createAdminRoute = (defaultPage: AdminPageKey): PluginRoute => ({
  handler: async (ctx) =>
    ADMIN_PAGE_BUILDERS[resolveAdminPage(ctx, defaultPage)](await summarizeContent(ctx)),
});

const resolveAdminPage = (ctx: RouteContext, defaultPage: AdminPageKey): AdminPageKey => {
  const pagePath = readPagePath(ctx.input);
  if (!pagePath) return defaultPage;

  return ADMIN_PAGE_PATHS[pagePath] ?? defaultPage;
};

const readPagePath = (input: unknown): keyof typeof ADMIN_PAGE_PATHS | undefined => {
  if (!input || typeof input !== "object") return undefined;
  const page = (input as Record<string, unknown>).page;
  if (typeof page !== "string") return undefined;
  if (page in ADMIN_PAGE_PATHS) return page as keyof typeof ADMIN_PAGE_PATHS;
  return undefined;
};

const summarizeContent = async (ctx: RouteContext): Promise<AdminSummary> => {
  const content = ctx.content;
  return {
    menus: await countCollection(content, MENU_COLLECTION),
    sections: await countCollection(content, MENU_SECTION_COLLECTION),
    items: await countCollection(content, MENU_ITEM_COLLECTION),
    restaurants: await countCollection(content, RESTAURANT_COLLECTION),
    hours: await countCollection(content, HOURS_COLLECTION),
    closures: await countCollection(content, CLOSURES_COLLECTION),
    settings: await countCollection(content, SETTINGS_COLLECTION),
  };
};

const countCollection = async (
  content: ContentAccess | undefined,
  collection: string,
): Promise<number> => {
  if (!content) return 0;
  try {
    const result = await content.list(collection, { limit: LIST_LIMIT });
    return result.items.length;
  } catch {
    return 0;
  }
};

const buildMenusPage = (summary: AdminSummary): BlockKitPage =>
  page("Menus", [
    section(
      "menus-intro",
      "Menu library",
      "Create menus, sections, and menu items for storefront display.",
    ),
    metrics("menus-summary", [
      metric("Menus", summary.menus),
      metric("Sections", summary.sections),
      metric("Items", summary.items),
    ]),
    actions("menus-actions", [
      button({
        action_id: "content.create.carte_menus",
        label: "Create menu",
        style: "primary",
      }),
      button({
        action_id: "content.create.carte_menu_items",
        label: "Create item",
      }),
      button({
        action_id: "route.post.menu-items/86",
        label: "86 item",
        style: "danger",
      }),
    ]),
  ]);

const buildRestaurantPage = (summary: AdminSummary): BlockKitPage =>
  page("Restaurant", [
    section(
      "restaurant-intro",
      "Restaurant profile",
      "Manage public restaurant identity and contact details.",
    ),
    metrics("restaurant-summary", [metric("Profiles", summary.restaurants)]),
    actions("restaurant-actions", [
      button({
        action_id: "content.edit.carte_restaurants",
        label: "Edit restaurant",
        style: "primary",
      }),
    ]),
  ]);

const buildHoursPage = (summary: AdminSummary): BlockKitPage =>
  page("Hours", [
    section("hours-intro", "Weekly hours", "Maintain regular service windows and dated closures."),
    metrics("hours-summary", [
      metric("Weekly entries", summary.hours),
      metric("Closures", summary.closures),
    ]),
    actions("hours-actions", [
      button({
        action_id: "content.create.carte_hours",
        label: "Add hours",
        style: "primary",
      }),
      button({ action_id: "content.create.carte_closures", label: "Add closure" }),
    ]),
  ]);

const buildSettingsPage = (summary: AdminSummary): BlockKitPage =>
  page("Settings", [
    section(
      "settings-intro",
      "Carte settings",
      "Configure currency, locale, timezone, and x402 wallet details.",
    ),
    section(
      "cloudflare-free-warning",
      "Cloudflare Free warning",
      "Cloudflare Free has no Dynamic Worker Loader, so sandboxed plugins run unsandboxed (in-process) instead of isolated. See EmDash Issue #149.",
    ),
    metrics("settings-summary", [metric("Settings records", summary.settings)]),
    actions("settings-actions", [
      button({
        action_id: "content.edit.carte_settings",
        label: "Edit settings",
        style: "danger",
      }),
    ]),
  ]);

const ADMIN_PAGE_BUILDERS = {
  menus: buildMenusPage,
  restaurant: buildRestaurantPage,
  hours: buildHoursPage,
  settings: buildSettingsPage,
};

const page = (title: string, blocks: Block[]): BlockKitPage => ({
  type: "page",
  plugin: PLUGIN_ID,
  title,
  blocks: blocks.flatMap((block, index) =>
    index === 0 ? [block] : [divider(`${block.block_id}-divider`), block],
  ),
});

const section = (id: string, title: string, text: string): SectionBlock => ({
  type: "section",
  block_id: id,
  text: `${title}. ${text}`,
});

const metrics = (id: string, items: MetricItem[]): StatsBlock => ({
  type: "stats",
  block_id: id,
  items,
});

const actions = (id: string, elements: Button[]): ActionsBlock => ({
  type: "actions",
  block_id: id,
  elements,
});

const metric = (label: string, count: number): MetricItem => ({ label, value: String(count) });
const divider = (id: string): DividerBlock => ({ type: "divider", block_id: id });

const button = ({ action_id, label, style }: ButtonInput): Button => ({
  type: "button",
  action_id,
  label,
  ...(style ? { style } : {}),
});
