import type { PluginRoute, RouteContext } from "emdash";
import type { PluginContext, SandboxedPlugin, SandboxedRouteContext } from "emdash/plugin";

import { gdprEraseRoute, gdprExportRoute } from "./gdpr.js";
import { afterSave, beforeSave } from "./hooks.js";
import { routes } from "./routes.js";

// Sandboxed routes use the two-arg ABI `(routeCtx, ctx)` and return plain
// JSON-serialisable values — the host wraps them via apiSuccess. The existing
// single-arg route modules expect a unified `RouteContext`, so adapt the
// sandboxed pair into one. `request` is reconstructed as a real `Request`
// (the sandbox passes a serialised `{ url, method, headers }` record).
const NO_REQUEST_META = { ip: null, userAgent: null, referer: null, geo: null } as const;

const toRouteContext = (routeCtx: SandboxedRouteContext, ctx: PluginContext): RouteContext => ({
  ...ctx,
  input: routeCtx.input,
  request: new Request(routeCtx.request.url, {
    method: routeCtx.request.method,
    headers: routeCtx.request.headers,
  }),
  requestMeta: NO_REQUEST_META,
});

const adaptRoute =
  (route: PluginRoute) =>
  async (routeCtx: SandboxedRouteContext, ctx: PluginContext): Promise<unknown> =>
    route.handler(toRouteContext(routeCtx, ctx));

const adaptedRoutes = Object.fromEntries(
  Object.entries(routes).map(([name, route]) => [name, { handler: adaptRoute(route) }]),
);

const plugin: SandboxedPlugin = {
  hooks: {
    "content:beforeSave": { handler: beforeSave },
    "content:afterSave": { handler: afterSave },
  },
  routes: {
    ...adaptedRoutes,
    "gdpr/erase": { handler: gdprEraseRoute },
    "gdpr/export": { handler: gdprExportRoute },
  },
};

export default plugin;
