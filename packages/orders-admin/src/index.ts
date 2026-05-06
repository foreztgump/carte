// @carte/orders-admin — native EmDash plugin skeleton.
//
// v0.1 scope (later mission): native React UI for the live orders queue,
// modifier management, order state transitions. Native plugins are
// locally registered and trusted (not sandboxed) — this package will
// host React under `admin/index.js` per `admin.entry`.

import { definePlugin } from "emdash";

import type { RouteContext } from "emdash";

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
      entry: "admin/index.js",
      pages: [
        { path: "/carte-orders", label: "Orders", icon: "shopping-bag" },
        { path: "/carte-orders/modifiers", label: "Modifiers", icon: "sliders" },
      ],
    },
  });

export default factory;
