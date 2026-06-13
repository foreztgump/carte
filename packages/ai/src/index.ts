// @carte/ai — native EmDash 0.18 plugin (paid SKU).
//
// v0.1 scope: BYO-LLM chat with tool-call streaming; read-by-default,
// write-on-confirm contract enforced at the tool-call boundary; license
// check at license.carteplugin.dev with 24h KV cache and graceful degrade.
// PII NEVER leaves to the LLM without explicit user consent — enforced at
// the boundary, not in prompts.
//
// Native (`definePlugin`) plugins run in-process and unsandboxed. The React
// admin is mounted via the documented 0.18 path: the admin `entry` field is a
// package module specifier resolving to the `./admin` export, which exposes
// `PluginAdminExports` (React elements keyed by `admin.pages[].path`). The host
// resolves `adminMode === "react"` from the presence of that entry field.

import { definePlugin } from "emdash";

import type { RouteContext } from "emdash";
import { checkLicense } from "./license.js";
import type { LicenseKv, LicenseRecord } from "./license.js";
import { chatStreamRoute, historyRoute } from "./routes/chat.js";
import { auditListRoute, confirmCallRoute, toolCallRoute, undoCallRoute } from "./tool-call.js";

const ADMIN_ENTRY = "@carte/ai/admin";

const PLUGIN_ID = "carte-ai";
const PLUGIN_VERSION = "0.3.0-rc.1";
const LICENSE_ENDPOINT = "https://license.carteplugin.dev/v1/license";

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

export interface LicenseCheckRouteDeps {
  fetchLicense?: (workspaceId: string) => Promise<LicenseRecord>;
  now?: Date;
}

export const licenseCheckRoute = async (
  ctx: RouteContext,
  deps: LicenseCheckRouteDeps = {},
): Promise<unknown> => {
  const workspaceId = requireWorkspaceId(ctx);
  const resolveLicense = deps.fetchLicense ?? fetchLicense;
  return checkLicense({
    workspaceId,
    kv: ctx.kv as LicenseKv,
    now: deps.now ?? new Date(),
    fetchLicense: () => resolveLicense(workspaceId),
  });
};

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write", "network:request"],
    allowedHosts: [
      "api.anthropic.com",
      "api.openai.com",
      "generativelanguage.googleapis.com",
      "license.carteplugin.dev",
    ],
    hooks: {},
    routes: {
      admin: { handler: stubRoute("admin") },
      "audit-list": { handler: auditListRoute },
      "chat-stream": { handler: chatStreamRoute },
      "confirm-call": { handler: confirmCallRoute },
      "tool-call": { handler: toolCallRoute },
      history: { handler: historyRoute },
      "license-check": { handler: licenseCheckRoute },
      "undo-call": { handler: undoCallRoute },
    },
    admin: {
      entry: ADMIN_ENTRY,
      settingsSchema: {
        anthropicApiKey: {
          type: "secret",
          label: "Anthropic API key",
          description: "Workspace-scoped BYO LLM key stored as a plugin secret.",
        },
        openaiApiKey: {
          type: "secret",
          label: "OpenAI API key",
          description: "Workspace-scoped BYO LLM key stored as a plugin secret.",
        },
        geminiApiKey: {
          type: "secret",
          label: "Gemini API key",
          description: "Workspace-scoped BYO LLM key stored as a plugin secret.",
        },
      },
      pages: [{ path: "/carte-ai", label: "Chat", icon: "sparkles" }],
    },
  });

// Named export consumed by the EmDash 0.18 native harness registry, which
// emits `import { createPlugin } from "<entrypoint>"` (VERIFIED-PLATFORM §5.1).
export const createPlugin = factory;

export default factory;

async function fetchLicense(workspaceId: string): Promise<LicenseRecord> {
  const response = await fetch(
    `${LICENSE_ENDPOINT}?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
  if (!response.ok) {
    throw new Error("License server returned an unsuccessful response.");
  }
  return (await response.json()) as LicenseRecord;
}

function requireWorkspaceId(ctx: RouteContext): string {
  const header = ctx.request?.headers?.get("X-Workspace-Id") ?? null;
  if (header !== null && header.trim() !== "") {
    return header;
  }
  throw new Error("X-Workspace-Id header is required for license-check.");
}
