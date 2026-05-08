// @carte/core — sandboxed EmDash plugin skeleton.
//
// v0.1 scope (later mission): menus, restaurant settings, hours,
// schema.org JSON-LD output. This file is the manifest skeleton only;
// hooks and routes return stub responses until the @carte/core
// implementation mission lands.
//
// Sandbox budget reminder (per AGENTS.md): each route handler must fit
// inside 50ms CPU + 10 subrequests + 30s wall-time + ~128MB memory.

import { definePlugin } from "emdash";

import type { ContentAccess, RouteContext } from "emdash";

const PLUGIN_ID = "carte-core";
const PLUGIN_VERSION = "0.1.0";
const EXPORT_PAGE_SIZE = 100;
const MAX_EXPORT_ITEMS = 1_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const ADMIN_SCOPE_HEADER = "x-emdash-admin-scope";

const GDPR_EXPORT_COLLECTIONS = [
  {
    collection: "carte_reservations",
    emailPath: ["guest", "email"],
  },
  {
    collection: "carte_orders",
    emailPath: ["customer", "email"],
  },
] as const;

type ExportedContentItem = Awaited<ReturnType<ContentAccess["list"]>>["items"][number];

const stubRoute =
  (route: string) =>
  async (ctx: RouteContext): Promise<{ ok: true; plugin: string; route: string }> => {
    void ctx;
    return { ok: true, plugin: PLUGIN_ID, route };
  };

const jsonResponse = (body: unknown, status = 200, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseEmail = (request: Request): string | null => {
  const email = new URL(request.url).searchParams.get("email");
  if (email === null) return null;
  const normalizedEmail = normalizeEmail(email);
  return EMAIL_PATTERN.test(normalizedEmail) ? normalizedEmail : null;
};

const hasAdminScope = (request: Request): boolean => {
  const scope = request.headers.get(ADMIN_SCOPE_HEADER)?.toLowerCase();
  return scope === "true" || scope === "admin" || scope === "1";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nestedValue = (source: Record<string, unknown>, path: readonly string[]): unknown => {
  let current: unknown = source;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
};

const itemEmailMatches = (
  item: ExportedContentItem,
  emailPath: readonly string[],
  normalizedEmail: string,
): boolean => {
  const value = nestedValue(item.data, emailPath);
  return typeof value === "string" && normalizeEmail(value) === normalizedEmail;
};

const listPageOptions = (cursor: string | undefined): { limit: number; cursor?: string } =>
  cursor === undefined ? { limit: EXPORT_PAGE_SIZE } : { limit: EXPORT_PAGE_SIZE, cursor };

const matchingItems = async (
  content: ContentAccess,
  collection: string,
  emailPath: readonly string[],
  normalizedEmail: string,
): Promise<ExportedContentItem[]> => {
  const matches: ExportedContentItem[] = [];
  let cursor: string | undefined;
  do {
    const page = await content.list(collection, listPageOptions(cursor));
    matches.push(
      ...page.items.filter((item) => itemEmailMatches(item, emailPath, normalizedEmail)),
    );
    cursor = page.cursor;
  } while (cursor !== undefined && matches.length < MAX_EXPORT_ITEMS);
  return matches;
};

const gdprExportRoute = async (ctx: RouteContext): Promise<Response> => {
  if (!hasAdminScope(ctx.request)) {
    return jsonResponse({ error: "Admin scope required" }, 401);
  }
  const email = parseEmail(ctx.request);
  if (email === null) return jsonResponse({ error: "Valid email query parameter required" }, 400);
  if (ctx.content === undefined) return jsonResponse({ error: "Content access unavailable" }, 500);
  const content = ctx.content;
  try {
    const [reservations, orders] = await Promise.all(
      GDPR_EXPORT_COLLECTIONS.map(({ collection, emailPath }) =>
        matchingItems(content, collection, emailPath, email),
      ),
    );
    return jsonResponse(
      { email, exportedAt: new Date().toISOString(), reservations, orders },
      200,
      { "content-disposition": `attachment; filename="carte-gdpr-export-${email}.json"` },
    );
  } catch (error) {
    ctx.log.error("GDPR export failed", { error });
    return jsonResponse({ error: "GDPR export failed" }, 500);
  }
};

const factory = () =>
  definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: ["content:read", "content:write", "media:read"],
    hooks: {},
    routes: {
      admin: { handler: stubRoute("admin") },
      "gdpr/export": { handler: gdprExportRoute },
      "menu-feed": { handler: stubRoute("menu-feed") },
      "schema-jsonld": { handler: stubRoute("schema-jsonld") },
    },
    admin: {
      pages: [
        { path: "/carte", label: "Menus", icon: "menu" },
        { path: "/carte/restaurant", label: "Restaurant", icon: "store" },
        { path: "/carte/hours", label: "Hours", icon: "clock" },
        { path: "/carte/settings", label: "Settings", icon: "cog" },
      ],
    },
  });

export default factory;
