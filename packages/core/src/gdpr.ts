import type { ContentAccess } from "emdash";
import type { PluginContext, SandboxedRouteContext } from "emdash/plugin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const AUDIT_COLLECTION = "carte_audit_log";
const AUDIT_ACTOR = "system:gdpr-erasure";
const AUDIT_ACTION = "gdpr.erasure";
const EXPORT_PAGE_SIZE = 100;
const MAX_EXPORT_ITEMS = 1_000;

const GDPR_EXPORT_COLLECTIONS = [
  { collection: "carte_reservations", emailPath: ["guest", "email"], piiContainer: "guest" },
  { collection: "carte_orders", emailPath: ["customer", "email"], piiContainer: "customer" },
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
type EraseFailure = { targetCollection: string; targetId: string; reason: string };
type EraseCollectionResult = { erased: number; failures: EraseFailure[] };

export class GdprRequestError extends Error {}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const parseEmail = (request: SandboxedRouteContext["request"]): string => {
  const email = new URL(request.url).searchParams.get("email");
  const normalizedEmail = email === null ? "" : normalizeEmail(email);
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new GdprRequestError("Valid email query parameter required");
  }
  return normalizedEmail;
};

const requireContent = (ctx: PluginContext): ContentAccess => {
  if (ctx.content === undefined) throw new GdprRequestError("Content access unavailable");
  return ctx.content;
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

const errorReason = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

// HR9: write the audit entry FIRST. Only erase PII if the audit succeeded, so
// no PII mutation can lack an audit trail even on transient audit-store failures.
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
      reason: errorReason(error, "audit-write-failed"),
    };
  }
  try {
    await content.update(collection.collection, item.id, erasedData);
  } catch (error) {
    return {
      targetCollection: collection.collection,
      targetId: item.id,
      reason: errorReason(error, "erase-update-failed"),
    };
  }
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

// eraseCollection can still reject (content.list throws while finding matches),
// so map any rejection to a per-collection failure instead of crashing the route.
const eraseCollectionSettled = async (
  args: EraseCollectionArgs,
): Promise<EraseCollectionResult> => {
  try {
    return await eraseCollection(args);
  } catch (error) {
    return {
      erased: 0,
      failures: [
        {
          targetCollection: args.collection.collection,
          targetId: "*",
          reason: errorReason(error, "erase-collection-failed"),
        },
      ],
    };
  }
};

type GdprExportResult = {
  email: string;
  exportedAt: string;
  reservations: ExportedContentItem[];
  orders: ExportedContentItem[];
};

export const gdprExportRoute = async (
  routeCtx: SandboxedRouteContext,
  ctx: PluginContext,
): Promise<GdprExportResult> => {
  const email = parseEmail(routeCtx.request);
  const content = requireContent(ctx);
  const [reservationDef, orderDef] = GDPR_EXPORT_COLLECTIONS;
  const [reservations, orders] = await Promise.all([
    matchingItems(content, reservationDef.collection, reservationDef.emailPath, email),
    matchingItems(content, orderDef.collection, orderDef.emailPath, email),
  ]);
  return { email, exportedAt: new Date().toISOString(), reservations, orders };
};

type GdprEraseResult = {
  email: string;
  erasedAt: string;
  erased: { reservations: number; orders: number };
  failed: EraseFailure[];
};

export const gdprEraseRoute = async (
  routeCtx: SandboxedRouteContext,
  ctx: PluginContext,
): Promise<GdprEraseResult> => {
  const email = parseEmail(routeCtx.request);
  const content = requireContent(ctx);
  if (!hasEraseCapabilities(content))
    throw new GdprRequestError("Content write access unavailable");
  const placeholder = await deterministicPlaceholder(email);
  const timestamp = new Date().toISOString();
  const [reservationDef, orderDef] = GDPR_EXPORT_COLLECTIONS;
  const eraseArgs = { content, normalizedEmail: email, placeholder, timestamp };
  const [reservations, orders] = await Promise.all([
    eraseCollectionSettled({ collection: reservationDef, ...eraseArgs }),
    eraseCollectionSettled({ collection: orderDef, ...eraseArgs }),
  ]);
  return {
    email,
    erasedAt: timestamp,
    erased: { reservations: reservations.erased, orders: orders.erased },
    failed: [...reservations.failures, ...orders.failures],
  };
};
