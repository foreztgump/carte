import type { PluginContext, SandboxedPlugin, SandboxedRouteContext } from "emdash/plugin";

import { enforceRateLimit, rateLimitResponse } from "./rate-limit.js";
import { renderReservationBlocksAdmin, renderReservationsAdmin } from "./routes/admin.js";
import { cancelReservationByToken } from "./routes/cancel.js";
import { confirmReservation } from "./routes/confirm.js";
import { submitReservation } from "./routes/submit.js";
import type { ReservationRouteContext } from "./routes/types.js";

type LegacyRouteHandler = (ctx: ReservationRouteContext) => Promise<unknown>;

const PLUGIN_ID = "carte-reservations";
const NO_REQUEST_META = { ip: null, userAgent: null, referer: null, geo: null } as const;

const stubRoute =
  (route: string): LegacyRouteHandler =>
  async (): Promise<{ ok: true; plugin: string; route: string }> => ({
    ok: true,
    plugin: PLUGIN_ID,
    route,
  });

const rateLimitedSubmitRoute = async (ctx: ReservationRouteContext): Promise<unknown> => {
  const limit = await enforceRateLimit(ctx, "submit");
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  return submitReservation(ctx);
};

const adaptRoute =
  (handler: LegacyRouteHandler) =>
  async (routeCtx: SandboxedRouteContext, ctx: PluginContext): Promise<unknown> => {
    const deferredTasks: Promise<unknown>[] = [];
    const result = await handler(toRouteContext(routeCtx, ctx, deferredTasks));
    await settleDeferredTasks(ctx, deferredTasks);
    return result;
  };

const settleDeferredTasks = async (
  ctx: PluginContext,
  tasks: Promise<unknown>[],
): Promise<void> => {
  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected")
      ctx.log.warn("Deferred reservation task failed", result.reason);
  }
};

const toRouteContext = (
  routeCtx: SandboxedRouteContext,
  ctx: PluginContext,
  deferredTasks: Promise<unknown>[],
): ReservationRouteContext => ({
  ...ctx,
  input: routeCtx.input,
  request: new Request(routeCtx.request.url, {
    method: routeCtx.request.method,
    headers: routeCtx.request.headers,
  }),
  requestMeta: (routeCtx.requestMeta as ReservationRouteContext["requestMeta"]) ?? NO_REQUEST_META,
  waitUntil: (task: Promise<unknown>) => {
    deferredTasks.push(task);
  },
});

const plugin: SandboxedPlugin = {
  routes: {
    admin: { handler: adaptRoute(renderReservationsAdmin) },
    "admin/blocks": { handler: adaptRoute(renderReservationBlocksAdmin) },
    "admin/settings": { handler: adaptRoute(stubRoute("admin/settings")) },
    submit: { handler: adaptRoute(rateLimitedSubmitRoute), public: true },
    confirm: { handler: adaptRoute(confirmReservation), public: true },
    "cancel-by-token": { handler: adaptRoute(cancelReservationByToken), public: true },
  },
};

export default plugin;
