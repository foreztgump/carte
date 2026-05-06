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

const PLUGIN_ID = "carte-ai";
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
      "chat-stream": { handler: stubRoute("chat-stream") },
      "tool-call": { handler: stubRoute("tool-call") },
      history: { handler: stubRoute("history") },
      "license-check": { handler: stubRoute("license-check") },
    },
    admin: {
      entry: "admin/index.js",
      pages: [{ path: "/carte-ai", label: "Chat", icon: "sparkles" }],
    },
  });

export default factory;
