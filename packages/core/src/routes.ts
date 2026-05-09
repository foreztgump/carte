import type { KVAccess, PluginRoute } from "emdash";

import { createAdminRoute } from "./admin-pages.js";
import { eightySixMenuItem, listMenuItems } from "./availability.js";
import { createSchemaJsonLd } from "./jsonld.js";

const TIMEZONE_SETTING_KEY = "settings:timezone";
const TIMEZONE_FALLBACK = "UTC";

const createMenuFeedRoute = (): PluginRoute => ({
  handler: async (ctx) => listMenuItems(ctx.content),
});

const createEightySixRoute = (): PluginRoute => ({
  handler: async (ctx) => {
    const input = ctx.input as { itemId?: unknown };
    const timezone = await readTimezone(ctx.kv);
    return eightySixMenuItem({ content: ctx.content, itemId: input.itemId, timezone });
  },
});

const readTimezone = async (kv: KVAccess): Promise<string> => {
  const value = await kv.get<string>(TIMEZONE_SETTING_KEY);
  return typeof value === "string" && value.length > 0 ? value : TIMEZONE_FALLBACK;
};

export const routes = {
  admin: createAdminRoute("menus"),
  "admin/hours": createAdminRoute("hours"),
  "admin/restaurant": createAdminRoute("restaurant"),
  "admin/settings": createAdminRoute("settings"),
  "menu-feed": createMenuFeedRoute(),
  "menu-items/86": createEightySixRoute(),
  "schema-jsonld": { handler: createSchemaJsonLd },
} satisfies Record<string, PluginRoute>;
