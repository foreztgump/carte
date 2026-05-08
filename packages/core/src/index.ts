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
const AUDIT_COLLECTION = "carte_audit_log";
const AUDIT_ACTOR = "system:gdpr-erasure";
const AUDIT_ACTION = "gdpr.erasure";

const GDPR_EXPORT_COLLECTIONS = [
  {
    collection: "carte_reservations",
    emailPath: ["guest", "email"],
    piiContainer: "guest",
  },
  {
    collection: "carte_orders",
    emailPath: ["customer", "email"],
    piiContainer: "customer",
  },
] as const;
const PII_FIELDS = ["name", "email", "phone", "notes"] as const;

type ExportedContentItem = Awaited<ReturnType<ContentAccess["list"]>>["items"][number];
type ContentUpdate = NonNullable<ContentAccess["update"]>;
type ContentCreate = NonNullable<ContentAccess["create"]>;
type EraseCapableContent = ContentAccess & { update: ContentUpdate; create: ContentCreate };
type EraseCollectionArgs = {
  collection: (typeof GDPR_EXPORT_COLLECTIONS)[number];
  content: EraseCapableContent;
  normalizedEmail: string;
  placeholder: string;
  timestamp: string;
};

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

const hasEraseCapabilities = (content: ContentAccess): content is EraseCapableContent =>
  typeof content.update === "function" && typeof content.create === "function";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const deterministicPlaceholder = async (normalizedEmail: string): Promise<string> =>
  `erased:${await sha256Hex(normalizedEmail)}`;

const stringField = (container: unknown, field: string): string => {
  if (!isRecord(container)) return "";
  const value = container[field];
  return typeof value === "string" ? value : "";
};

const piiHash = async (data: Record<string, unknown>, containerKey: string): Promise<string> => {
  const container = data[containerKey];
  const joined = PII_FIELDS.map((field) => stringField(container, field)).join("|");
  return sha256Hex(joined);
};

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

const dataWithErasedPii = (
  data: Record<string, unknown>,
  containerKey: string,
  placeholder: string,
): Record<string, unknown> => {
  const sourceContainer = data[containerKey];
  const container = isRecord(sourceContainer) ? sourceContainer : {};
  const erasedContainer: Record<string, unknown> = { ...container };
  for (const field of PII_FIELDS) erasedContainer[field] = placeholder;
  return { ...data, [containerKey]: erasedContainer };
};

const eraseAndAuditItem = async (
  item: ExportedContentItem,
  args: EraseCollectionArgs,
): Promise<void> => {
  const { collection, content, placeholder, timestamp } = args;
  const erasedData = dataWithErasedPii(item.data, collection.piiContainer, placeholder);
  const [beforeHash, afterHash] = await Promise.all([
    piiHash(item.data, collection.piiContainer),
    piiHash(erasedData, collection.piiContainer),
  ]);
  await content.update(collection.collection, item.id, erasedData);
  await content.create(AUDIT_COLLECTION, {
    actor: AUDIT_ACTOR,
    action: AUDIT_ACTION,
    targetCollection: collection.collection,
    targetId: item.id,
    beforeHash,
    afterHash,
    timestamp,
  });
};

const eraseCollection = async (args: EraseCollectionArgs): Promise<number> => {
  const { collection, content, normalizedEmail } = args;
  const matches = await matchingItems(
    content,
    collection.collection,
    collection.emailPath,
    normalizedEmail,
  );
  await Promise.all(matches.map((item) => eraseAndAuditItem(item, args)));
  return matches.length;
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

const gdprEraseRoute = async (ctx: RouteContext): Promise<Response> => {
  if (!hasAdminScope(ctx.request)) {
    return jsonResponse({ error: "Admin scope required" }, 401);
  }
  const email = parseEmail(ctx.request);
  if (email === null) return jsonResponse({ error: "Valid email query parameter required" }, 400);
  if (ctx.content === undefined) return jsonResponse({ error: "Content access unavailable" }, 500);
  const content = ctx.content;
  if (!hasEraseCapabilities(content))
    return jsonResponse({ error: "Content write access unavailable" }, 500);
  try {
    const placeholder = await deterministicPlaceholder(email);
    const timestamp = new Date().toISOString();
    const [reservations, orders] = await Promise.all(
      GDPR_EXPORT_COLLECTIONS.map((collection) =>
        eraseCollection({ collection, content, normalizedEmail: email, placeholder, timestamp }),
      ),
    );
    return jsonResponse({
      email,
      erasedAt: timestamp,
      erased: { reservations, orders },
    });
  } catch (error) {
    ctx.log.error("GDPR erasure failed", { error });
    return jsonResponse({ error: "GDPR erasure failed" }, 500);
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
      "gdpr/erase": { handler: gdprEraseRoute },
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
