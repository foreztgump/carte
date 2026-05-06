import type { PluginRoute, RouteContext } from "emdash";

const PLUGIN_ID = "carte-core";

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

export const routes = {
  admin: { handler: stubRoute("admin") },
  "admin/hours": { handler: stubRoute("admin/hours") },
  "admin/restaurant": { handler: stubRoute("admin/restaurant") },
  "admin/settings": { handler: stubRoute("admin/settings") },
  "menu-feed": { handler: stubRoute("menu-feed") },
  "schema-jsonld": { handler: stubRoute("schema-jsonld") },
} satisfies Record<string, PluginRoute>;
