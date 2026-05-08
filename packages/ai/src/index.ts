// @carte/ai — native EmDash plugin skeleton (paid SKU).
//
// v0.1 scope (later mission): BYO-LLM chat with tool-call streaming;
// read-by-default, write-on-confirm contract enforced at the tool-call
// boundary; license check at license.carteplugin.dev with 24h KV cache
// and graceful degrade. PII NEVER leaves to the LLM without explicit
// user consent — enforced at the boundary, not in prompts.
//
// Native plugin (locally registered, trusted). The future React entry
// will live at `admin/index.js` per `admin.entry`.

import { definePlugin } from "emdash";

import type { RouteContext } from "emdash";
import { checkLicense } from "./license.js";
import type { LicenseKv, LicenseRecord } from "./license.js";
import { chatStreamRoute, historyRoute } from "./routes/chat.js";
import { toolCallRoute } from "./tool-call.js";

const PLUGIN_ID = "carte-ai";
const PLUGIN_VERSION = "0.1.0";
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
  const workspaceId = workspaceIdFrom(ctx.input);
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
      "chat-stream": { handler: chatStreamRoute },
      "tool-call": { handler: toolCallRoute },
      history: { handler: historyRoute },
      "license-check": { handler: licenseCheckRoute },
    },
    admin: {
      entry: "admin/index.js",
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

function workspaceIdFrom(input: unknown): string {
  if (isRecord(input) && typeof input.workspaceId === "string") {
    return input.workspaceId;
  }
  return "default";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
