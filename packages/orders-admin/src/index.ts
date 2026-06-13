// @carte/orders-admin — native EmDash 0.18 plugin.
//
// Native (`definePlugin`) plugins run in-process and unsandboxed. The React
// admin is mounted via the documented 0.18 path: the admin `entry` field is a
// package module specifier resolving to the `./admin` export, which exposes
// `PluginAdminExports` (React elements keyed by `admin.pages[].path`). The host
// resolves `adminMode === "react"` from the presence of that entry field.

import { definePlugin } from "emdash";

import type { RouteContext } from "emdash";

export { OrdersAdminApp, getInitialOrdersAdminRoute } from "./admin/App.js";
export { mountOrdersAdmin } from "./admin/index.js";

const ADMIN_ENTRY = "@carte/orders-admin/admin";

const PLUGIN_ID = "carte-orders-admin";
const PLUGIN_VERSION = "0.1.0";

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write"],
    hooks: {},
    routes: {
      admin: { handler: stubRoute("admin") },
    },
    admin: {
      entry: ADMIN_ENTRY,
      pages: [
        { path: "/carte-orders", label: "Orders", icon: "shopping-bag" },
        { path: "/carte-orders/modifiers", label: "Modifiers", icon: "sliders" },
      ],
    },
  });

export default factory;
