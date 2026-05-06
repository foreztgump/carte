// @carte/core — sandboxed EmDash plugin manifest.
//
// Sandbox budget reminder (per AGENTS.md): current stub route handlers perform
// 0 subrequests; content:afterSave cache invalidation schedules 2 plugin KV
// deletes inside ctx.waitUntil, keeping response-path work bounded.

import { definePlugin } from "emdash";

import type { RouteContext } from "emdash";
import { afterSave, beforeSave } from "./hooks.js";

const PLUGIN_ID = "carte-core";
const PLUGIN_VERSION = "0.1.0";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_MENU_LOCALE = "en";
const DEFAULT_TIMEZONE = "America/Los_Angeles";
const DEFAULT_X402_WALLET_ADDRESS = "";

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
    capabilities: ["content:read", "content:write", "media:read"],
    hooks: {
      "content:beforeSave": beforeSave,
      "content:afterSave": afterSave,
    },
    routes: {
      admin: { handler: stubRoute("admin") },
      "admin/hours": { handler: stubRoute("admin/hours") },
      "admin/restaurant": { handler: stubRoute("admin/restaurant") },
      "admin/settings": { handler: stubRoute("admin/settings") },
      "menu-feed": { handler: stubRoute("menu-feed") },
      "schema-jsonld": { handler: stubRoute("schema-jsonld") },
    },
    admin: {
      settingsSchema: {
        defaultCurrency: {
          type: "string",
          label: "Default currency",
          default: DEFAULT_CURRENCY,
          description: "ISO 4217 currency used for menu prices.",
        },
        defaultMenuLocale: {
          type: "string",
          label: "Default menu locale",
          default: DEFAULT_MENU_LOCALE,
          description: "BCP 47 locale used for menu labels and descriptions.",
        },
        timezone: {
          type: "string",
          label: "Restaurant timezone",
          default: DEFAULT_TIMEZONE,
          description: "IANA timezone used for hours and daily availability.",
        },
        x402WalletAddress: {
          type: "string",
          label: "x402 wallet address",
          default: DEFAULT_X402_WALLET_ADDRESS,
          description: "Optional wallet address for x402-gated menu content.",
        },
      },
      pages: [
        { path: "/carte", label: "Menus", icon: "menu" },
        { path: "/carte/restaurant", label: "Restaurant", icon: "store" },
        { path: "/carte/hours", label: "Hours", icon: "clock" },
        { path: "/carte/settings", label: "Settings", icon: "cog" },
      ],
    },
  });

export default factory;
