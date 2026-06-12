import type { PluginContext } from "emdash/plugin";
import type { SandboxedPlugin } from "emdash/plugin";

const pluginId = "carte-harness-probe";
const claimKind = "capacity-slot";
const cpuProbeTargetMs = 75;
const subrequestProbeCount = 12;

function hookEventId(hook: string): string {
  return `${hook}-${Date.now()}-${crypto.randomUUID()}`;
}

function eventShape(event: {
  content: Record<string, unknown>;
  collection: string;
  isNew: boolean;
}) {
  return {
    contentKeys: Object.keys(event.content).sort(),
    collection: event.collection,
    hookEventFields: Object.keys(event).sort(),
    isNew: event.isNew,
  };
}

function busyWait(milliseconds: number): number {
  const start = performance.now();
  while (performance.now() - start < milliseconds) {
    Math.sqrt(Math.random());
  }
  return Math.round(performance.now() - start);
}

async function recordHookEvent(
  ctx: PluginContext,
  hook: string,
  event: { content: Record<string, unknown>; collection: string; isNew: boolean },
): Promise<void> {
  await ctx.storage.hook_events.put(hookEventId(hook), {
    hook,
    ...eventShape(event),
  });
}

/**
 * Sandboxed plugin entry. Keep the const annotation form because
 * the inline satisfies form fails plugin-cli declaration generation
 * under pnpm.
 */
const plugin: SandboxedPlugin = {
  hooks: {
    "content:beforeSave": {
      priority: 10,
      handler: async (event, ctx) => {
        await recordHookEvent(ctx, "content:beforeSave", event);
        return event.content;
      },
    },
    "content:afterSave": {
      handler: async (event, ctx) => {
        await recordHookEvent(ctx, "content:afterSave", event);
      },
    },
  },
  routes: {
    ping: {
      public: true,
      handler: async () => ({
        ok: true,
        plugin: pluginId,
      }),
    },
    private: {
      handler: async () => ({
        ok: true,
        auth: "required",
        plugin: pluginId,
      }),
    },
    admin: {
      handler: async () => ({
        blocks: [
          { type: "header", text: "Probe" },
          {
            type: "stats",
            items: [{ label: "Schema", value: "accepted" }],
          },
        ],
      }),
    },
    hookEvents: {
      public: true,
      handler: async (_routeCtx, ctx) => {
        const result = await ctx.storage.hook_events.query({ limit: 10 });
        return { events: result.items };
      },
    },
    uniqueConflict: {
      public: true,
      handler: async (_routeCtx, ctx) => {
        const slotKey = `slot-${Date.now()}-${crypto.randomUUID()}`;
        const firstId = `first-${slotKey}`;
        const duplicateId = `duplicate-${slotKey}`;
        let firstWritten = false;
        try {
          await ctx.storage.probe_claims.put(firstId, { kind: claimKind, slotKey });
          firstWritten = true;
          await ctx.storage.probe_claims.put(duplicateId, { kind: claimKind, slotKey });
          return { duplicateWrite: "accepted", slotKey };
        } catch (error) {
          return {
            duplicateWrite: "conflict",
            errorName: error instanceof Error ? error.name : "UnknownError",
            firstWrite: "accepted",
            slotKey,
          };
        } finally {
          if (firstWritten) await ctx.storage.probe_claims.delete(firstId);
          await ctx.storage.probe_claims.delete(duplicateId);
        }
      },
    },
    postResponsePrimitive: {
      public: true,
      handler: async (_routeCtx, ctx) => ({
        ctxKeys: Object.keys(ctx).sort(),
        ctxWaitUntilType: typeof Reflect.get(ctx, "waitUntil"),
        globalAfterType: typeof Reflect.get(globalThis, "after"),
        hasCtxWaitUntil: "waitUntil" in ctx,
        hasGlobalAfter: "after" in globalThis,
      }),
    },
    runtimeLimitProbe: {
      public: true,
      handler: async (_routeCtx, ctx) => {
        const cpuLoopMs = busyWait(cpuProbeTargetMs);
        const kvReads = await Promise.all(
          Array.from({ length: subrequestProbeCount }, (_value, index) =>
            ctx.kv.get(`runtime-limit:${index}`),
          ),
        );

        return {
          cpuLoopMs,
          kvReads: kvReads.length,
          note: "workerd accepted >50ms CPU loop and >10 bridge reads",
        };
      },
    },
  },
};

export default plugin;
