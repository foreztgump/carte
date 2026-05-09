// @carte/core — sandboxed EmDash plugin manifest.
//
// Sandbox budget reminder (per AGENTS.md): current stub route handlers perform
// 0 subrequests; content:afterSave cache invalidation schedules 2 plugin KV
// deletes inside ctx.waitUntil, keeping response-path work bounded.

import { definePlugin } from "emdash";

import type { ContentAccess, RouteContext } from "emdash";

import { afterSave, beforeSave } from "./hooks.js";
import { routes } from "./routes.js";

const PLUGIN_ID = "carte-core";
const PLUGIN_VERSION = "0.1.0";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_MENU_LOCALE = "en";
const DEFAULT_TIMEZONE = "America/Los_Angeles";
const DEFAULT_X402_WALLET_ADDRESS = "";
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

type EraseFailure = {
  targetCollection: string;
  targetId: string;
  reason: string;
};

type EraseCollectionResult = {
  erased: number;
  failures: EraseFailure[];
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

const errorReason = (error: unknown): string =>
  error instanceof Error ? error.message : "audit-write-failed";

// HR9: write the audit entry FIRST. Only erase PII if the audit succeeded.
// This guarantees no PII mutation lacks an audit trail, even on transient
// audit-store failures.
const auditThenEraseItem = async (
  item: ExportedContentItem,
  args: EraseCollectionArgs,
): Promise<EraseFailure | null> => {
  const { collection, content, placeholder, timestamp } = args;
  const erasedData = dataWithErasedPii(item.data, collection.piiContainer, placeholder);
  const [beforeHash, afterHash] = await Promise.all([
    piiHash(item.data, collection.piiContainer),
    piiHash(erasedData, collection.piiContainer),
  ]);
  try {
    await content.create(AUDIT_COLLECTION, {
      actor: AUDIT_ACTOR,
      action: AUDIT_ACTION,
      targetCollection: collection.collection,
      targetId: item.id,
      beforeHash,
      afterHash,
      timestamp,
    });
  } catch (error) {
    return {
      targetCollection: collection.collection,
      targetId: item.id,
      reason: errorReason(error),
    };
  }
  await content.update(collection.collection, item.id, erasedData);
  return null;
};

const eraseCollection = async (args: EraseCollectionArgs): Promise<EraseCollectionResult> => {
  const { collection, content, normalizedEmail } = args;
  const matches = await matchingItems(
    content,
    collection.collection,
    collection.emailPath,
    normalizedEmail,
  );
  const failures: EraseFailure[] = [];
  let erased = 0;
  for (const item of matches) {
    const failure = await auditThenEraseItem(item, args);
    if (failure === null) erased += 1;
    else failures.push(failure);
  }
  return { erased, failures };
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
    const exportedAt = new Date().toISOString();
    const emailDigest = (await sha256Hex(email)).slice(0, 16);
    const safeName = `gdpr-export-${emailDigest}-${exportedAt}.json`;
    const disposition = `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
    return jsonResponse({ email, exportedAt, reservations, orders }, 200, {
      "content-disposition": disposition,
    });
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
    const [reservations, orders] = (await Promise.all(
      GDPR_EXPORT_COLLECTIONS.map((collection) =>
        eraseCollection({ collection, content, normalizedEmail: email, placeholder, timestamp }),
      ),
    )) as [EraseCollectionResult, EraseCollectionResult];
    const failed = [...reservations.failures, ...orders.failures];
    const status = failed.length === 0 ? 200 : 207;
    return jsonResponse(
      {
        email,
        erasedAt: timestamp,
        erased: { reservations: reservations.erased, orders: orders.erased },
        failed,
      },
      status,
    );
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
    hooks: {
      "content:beforeSave": beforeSave,
      "content:afterSave": afterSave,
    },
    routes: {
      ...routes,
      "gdpr/erase": { handler: gdprEraseRoute },
      "gdpr/export": { handler: gdprExportRoute },
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
