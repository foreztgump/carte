import type { PluginRoute, RouteContext } from "emdash";

import { createAdminRoute } from "./admin-pages.js";

const PLUGIN_ID = "carte-core";

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

export const routes = {
  admin: createAdminRoute("menus"),
  "admin/hours": createAdminRoute("hours"),
  "admin/restaurant": createAdminRoute("restaurant"),
  "admin/settings": createAdminRoute("settings"),
  "menu-feed": { handler: stubRoute("menu-feed") },
  "schema-jsonld": { handler: stubRoute("schema-jsonld") },
} satisfies Record<string, PluginRoute>;
