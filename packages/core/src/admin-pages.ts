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

type Block = SectionBlock | MetricsBlock | ActionsBlock | DividerBlock;
type ButtonStyle = "primary" | "secondary" | "warning";

type Button = {
  type: "button";
  id: string;
  label: string;
  action: string;
  style?: ButtonStyle;
};

type ButtonInput = Omit<Button, "type">;

type SectionBlock = { type: "section"; id: string; title: string; text: string };
type DividerBlock = { type: "divider"; id: string };
type ActionsBlock = { type: "actions"; id: string; label: string; items: Button[] };
type MetricsBlock = { type: "metrics"; id: string; label: string; items: MetricItem[] };
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

export const createAdminRoute = (page: keyof typeof ADMIN_PAGE_BUILDERS): PluginRoute => ({
  handler: async (ctx) => ADMIN_PAGE_BUILDERS[page](await summarizeContent(ctx)),
});

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
    metrics("menus-summary", "Menu summary", [
      metric("Menus", summary.menus),
      metric("Sections", summary.sections),
      metric("Items", summary.items),
    ]),
    actions("menus-actions", "Menu actions", [
      button({
        id: "create-menu",
        label: "Create menu",
        action: "content.create.carte_menus",
        style: "primary",
      }),
      button({
        id: "create-item",
        label: "Create item",
        action: "content.create.carte_menu_items",
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
    metrics("restaurant-summary", "Restaurant summary", [metric("Profiles", summary.restaurants)]),
    actions("restaurant-actions", "Restaurant actions", [
      button({
        id: "edit-restaurant",
        label: "Edit restaurant",
        action: "content.edit.carte_restaurants",
        style: "primary",
      }),
    ]),
  ]);

const buildHoursPage = (summary: AdminSummary): BlockKitPage =>
  page("Hours", [
    section("hours-intro", "Weekly hours", "Maintain regular service windows and dated closures."),
    metrics("hours-summary", "Hours summary", [
      metric("Weekly entries", summary.hours),
      metric("Closures", summary.closures),
    ]),
    actions("hours-actions", "Hours actions", [
      button({
        id: "add-hours",
        label: "Add hours",
        action: "content.create.carte_hours",
        style: "primary",
      }),
      button({ id: "add-closure", label: "Add closure", action: "content.create.carte_closures" }),
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
      "Cloudflare Free means sandboxed isolation is degraded and plugins run trusted. See EmDash Issue #149.",
    ),
    metrics("settings-summary", "Settings summary", [metric("Settings records", summary.settings)]),
    actions("settings-actions", "Settings actions", [
      button({
        id: "edit-settings",
        label: "Edit settings",
        action: "content.edit.carte_settings",
        style: "warning",
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
    index === 0 ? [block] : [divider(`${block.id}-divider`), block],
  ),
});

const section = (id: string, title: string, text: string): SectionBlock => ({
  type: "section",
  id,
  title,
  text,
});

const metrics = (id: string, label: string, items: MetricItem[]): MetricsBlock => ({
  type: "metrics",
  id,
  label,
  items,
});

const actions = (id: string, label: string, items: Button[]): ActionsBlock => ({
  type: "actions",
  id,
  label,
  items,
});

const metric = (label: string, count: number): MetricItem => ({ label, value: String(count) });
const divider = (id: string): DividerBlock => ({ type: "divider", id });

const button = ({ id, label, action, style }: ButtonInput): Button => ({
  type: "button",
  id,
  label,
  action,
  ...(style ? { style } : {}),
});
