import type { PluginRoute } from "emdash";

import { createAdminRoute } from "./admin-pages.js";
import { eightySixMenuItem, listMenuItems } from "./availability.js";
import { createSchemaJsonLd } from "./jsonld.js";

const createMenuFeedRoute = (): PluginRoute => ({
  handler: async (ctx) => listMenuItems(ctx.content),
});

const createEightySixRoute = (): PluginRoute => ({
  handler: async (ctx) => {
    const input = ctx.input as { itemId?: unknown };
    return eightySixMenuItem({ content: ctx.content, itemId: input.itemId });
  },
});

export const routes = {
  admin: createAdminRoute("menus"),
  "admin/hours": createAdminRoute("hours"),
  "admin/restaurant": createAdminRoute("restaurant"),
  "admin/settings": createAdminRoute("settings"),
  "menu-feed": createMenuFeedRoute(),
  "menu-items/86": createEightySixRoute(),
  "schema-jsonld": { handler: createSchemaJsonLd },
} satisfies Record<string, PluginRoute>;
