import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { gdprEraseRoute, gdprExportRoute } from "../gdpr.js";
import { afterSave } from "../hooks.js";
import plugin from "../plugin.js";
import { routes } from "../routes.js";

import type { ContentAccess, ContentHookEvent, ContentItem, KVAccess, RouteContext } from "emdash";
import type { PluginContext, SandboxedRouteContext } from "emdash/plugin";

const EXPECTED_CAPABILITIES = ["content:read", "content:write", "media:read"];
const EXPECTED_CORE_COLLECTIONS = [
  "carte_audit_log",
  "carte_closures",
  "carte_hours",
  "carte_menu_items",
  "carte_menu_sections",
  "carte_menus",
  "carte_orders",
  "carte_reservations",
  "carte_restaurants",
  "carte_settings",
];
const stripJsonc = (source: string): string =>
  source.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");

const manifest = JSON.parse(
  stripJsonc(
    readFileSync(fileURLToPath(new URL("../../emdash-plugin.jsonc", import.meta.url)), "utf8"),
  ),
) as {
  slug: string;
  publisher: string;
  license: string;
  capabilities: string[];
  storage: Record<string, { indexes: unknown[]; uniqueIndexes?: unknown[] }>;
  admin: { pages: Array<{ path: string; label: string }> };
};

type TrackedContent = ContentAccess & {
  create: NonNullable<ContentAccess["create"]>;
  update: NonNullable<ContentAccess["update"]>;
  touched: Set<string>;
};

const item = (collection: string, id: string, data: Record<string, unknown>): ContentItem => ({
  id,
  type: collection,
  slug: id,
  status: "published",
  locale: "en",
  data,
  createdAt: "2026-05-06T00:00:00.000Z",
  updatedAt: "2026-05-06T00:00:00.000Z",
  publishedAt: "2026-05-06T00:00:00.000Z",
});

const fixtures = (collection: string): ContentItem[] => {
  if (collection === "carte_restaurants")
    return [item(collection, "restaurant", { name: "Carte" })];
  if (collection === "carte_menu_sections") return [item(collection, "section", { name: "Main" })];
  if (collection === "carte_menu_items") return [item(collection, "item-1", { name: "Soup" })];
  if (collection === "carte_reservations")
    return [item(collection, "reservation", { guest: { email: "guest@example.com" } })];
  if (collection === "carte_orders")
    return [item(collection, "order", { customer: { email: "guest@example.com" } })];
  return [item(collection, collection, { name: collection })];
};

const trackedContent = (): TrackedContent => {
  const touched = new Set<string>();
  const remember = (collection: string): void => {
    touched.add(collection);
  };
  return {
    touched,
    get: async (collection, id) => {
      remember(collection);
      return item(collection, id, {});
    },
    list: async (collection) => {
      remember(collection);
      return { items: fixtures(collection), hasMore: false };
    },
    create: async (collection, data) => {
      remember(collection);
      return item(collection, "created", data);
    },
    update: async (collection, id, data) => {
      remember(collection);
      return item(collection, id, data);
    },
  };
};

const kv = (): KVAccess =>
  ({
    get: async () => null,
    set: async () => undefined,
    put: async () => undefined,
    delete: async () => undefined,
    list: async () => ({ keys: [], list_complete: true }),
  }) as KVAccess;

const routeCtx = (content: ContentAccess, input: Record<string, unknown> = {}): RouteContext =>
  ({
    plugin: { id: "carte-core", version: "0.0.0-test" },
    storage: {},
    kv: kv(),
    content,
    input,
    request: new Request("https://example.test/_emdash/api/plugins/carte-core/test"),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
    log: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    site: { url: "https://example.test", name: "Carte" },
    url: (path: string) => `https://example.test${path}`,
  }) as RouteContext;

const pluginCtx = (content: ContentAccess): PluginContext => routeCtx(content) as PluginContext;

const sandboxRouteCtx = (): SandboxedRouteContext => ({
  input: {},
  request: {
    url: "https://example.test/_emdash/api/plugins/carte-core/gdpr?email=guest@example.com",
    method: "GET",
    headers: {},
  },
});

const exerciseCoreAccessors = async (content: TrackedContent): Promise<string[]> => {
  await routes.admin.handler(routeCtx(content));
  await routes["admin/restaurant"].handler(routeCtx(content));
  await routes["admin/hours"].handler(routeCtx(content));
  await routes["admin/settings"].handler(routeCtx(content));
  await routes["menu-feed"].handler(routeCtx(content));
  await routes["menu-items/86"].handler(routeCtx(content, { itemId: "item-1" }));
  await routes["schema-jsonld"].handler(routeCtx(content));
  await gdprExportRoute(sandboxRouteCtx(), pluginCtx(content));
  await gdprEraseRoute(sandboxRouteCtx(), pluginCtx(content));
  await afterSave(allergenEvent(), pluginCtx(content));
  return [...content.touched].sort();
};

const allergenEvent = (): ContentHookEvent => ({
  collection: "carte_menu_items",
  content: { id: "item-1", allergens: ["peanuts"] },
  isNew: true,
});

describe("@carte/core manifest", () => {
  it("declares the canonical trust contract in emdash-plugin.jsonc", () => {
    expect(manifest.slug).toBe("carte-core");
    expect(manifest.license).toBe("MIT");
    expect(manifest.publisher).toMatch(/^(did:plc:|[a-z0-9.-]+$)/u);
  });

  it("declares only the minimal canonical capabilities in the manifest", () => {
    expect(manifest.capabilities).toEqual(EXPECTED_CAPABILITIES);
  });

  it("declares every collection exercised by core routes and hooks", async () => {
    const accessedCollections = await exerciseCoreAccessors(trackedContent());

    expect(accessedCollections).toEqual(EXPECTED_CORE_COLLECTIONS);
    expect(Object.keys(manifest.storage).sort()).toEqual(EXPECTED_CORE_COLLECTIONS);
  });

  it("declares the four Block Kit admin pages in the manifest", () => {
    expect(manifest.admin.pages.map((page) => page.path)).toEqual([
      "/carte",
      "/carte/restaurant",
      "/carte/hours",
      "/carte/settings",
    ]);
  });

  it("exposes all core route surfaces on the sandboxed plugin", () => {
    expect(Object.keys(plugin.routes ?? {}).sort()).toEqual([
      "admin",
      "admin/hours",
      "admin/restaurant",
      "admin/settings",
      "gdpr/erase",
      "gdpr/export",
      "menu-feed",
      "menu-items/86",
      "schema-jsonld",
    ]);
  });
});
