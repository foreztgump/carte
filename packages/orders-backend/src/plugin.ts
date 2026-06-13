import type { RouteContext } from "emdash";
import type { PluginContext, SandboxedPlugin, SandboxedRouteContext } from "emdash/plugin";

import { enforceRateLimit, rateLimitResponse } from "./rate-limit.js";
import { adminRoute } from "./routes/admin.js";
import { checkoutRoute } from "./routes/checkout.js";
import { refundRoute } from "./routes/refund.js";
import { createStaleStripeSettingsWarning } from "./stale-stripe-warning.js";

// Sandboxed routes use the two-arg ABI `(routeCtx, ctx)` and return plain
// JSON-serialisable values. The existing route modules expect a unified
// `RouteContext`, so adapt the sandboxed pair into one. Deferred tasks are
// settled in-request (the sandbox has no post-response primitive —
// VERIFIED-PLATFORM-0.18-carte §7) before the handler result returns.
const NO_REQUEST_META = { ip: null, userAgent: null, referer: null, geo: null } as const;

type LegacyRouteHandler = (ctx: RouteContext) => Promise<unknown>;

interface BlockKitPage {
  type: "page";
  blocks: unknown[];
}

const toRouteContext = (
  routeCtx: SandboxedRouteContext,
  ctx: PluginContext,
  deferredTasks: Promise<unknown>[],
): RouteContext =>
  ({
    ...ctx,
    input: routeCtx.input,
    request: new Request(routeCtx.request.url, {
      method: routeCtx.request.method,
      headers: routeCtx.request.headers,
    }),
    requestMeta: NO_REQUEST_META,
    waitUntil: (task: Promise<unknown>) => {
      deferredTasks.push(task);
    },
  }) as RouteContext;

const settleDeferredTasks = async (
  ctx: PluginContext,
  tasks: Promise<unknown>[],
): Promise<void> => {
  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") ctx.log.warn("Deferred orders task failed", result.reason);
  }
};

const adaptRoute =
  (handler: LegacyRouteHandler) =>
  async (routeCtx: SandboxedRouteContext, ctx: PluginContext): Promise<unknown> => {
    const deferredTasks: Promise<unknown>[] = [];
    const result = await handler(toRouteContext(routeCtx, ctx, deferredTasks));
    await settleDeferredTasks(ctx, deferredTasks);
    return result;
  };

const rateLimitedCheckoutRoute = async (ctx: RouteContext): Promise<unknown> => {
  const limit = await enforceRateLimit(ctx, "checkout");
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
  return checkoutRoute(ctx);
};

const adminRouteWithMigrationWarning = async (ctx: RouteContext): Promise<unknown> => {
  const [page, warning] = await Promise.all([
    adminRoute(ctx),
    createStaleStripeSettingsWarning(ctx).catch(() => null),
  ]);
  if (warning === null) return page;
  return { ...page, blocks: [warning, ...page.blocks] } satisfies BlockKitPage;
};

const plugin: SandboxedPlugin = {
  routes: {
    admin: { handler: adaptRoute(adminRouteWithMigrationWarning) },
    checkout: { handler: adaptRoute(rateLimitedCheckoutRoute), public: true },
    refund: { handler: adaptRoute(refundRoute) },
  },
};

export default plugin;
