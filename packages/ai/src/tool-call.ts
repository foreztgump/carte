export const TOOL_CONFIRMATION_TTL_SECONDS = 600;
export const TOOL_UNDO_TTL_SECONDS = 600;
export const TOOL_UNDO_STATUS_TTL_SECONDS = 900;

export interface ToolCallKv {
  get<T>(key: string): Promise<T | null>;
  list?: (prefix?: string) => Promise<Array<{ key: string; value: unknown }>>;
  put?: (key: string, value: unknown, options?: { expirationTtl?: number }) => Promise<void>;
  set?: (key: string, value: unknown, options?: { expirationTtl?: number }) => Promise<void>;
  delete?: (key: string) => Promise<boolean | void>;
}

export interface ToolCallContext {
  input: unknown;
  kv: ToolCallKv;
  content?: ContentApi;
  request?: Request;
}

export interface ContentApi {
  list?: (collection: string) => Promise<unknown>;
  update?: (collection: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export interface DiffPreview {
  before: unknown;
  after: unknown;
}

export interface MutationResult extends DiffPreview {
  result?: unknown;
}

export interface UndoRecord extends MutationResult {
  expiresAt?: string;
  input: unknown;
  toolName: string;
}

interface UndoStatusRecord {
  expiredAt: string;
  status: "pending" | "undone";
}

interface UndoStatusMutation {
  expiredAt: string | undefined;
  kv: ToolCallKv;
  undoToken: string;
  workspaceId: string;
}

interface ExpiringUndoStatusMutation extends UndoStatusMutation {
  expiredAt: string;
}

interface UndoStatusWrite {
  kv: ToolCallKv;
  status: UndoStatusRecord;
  undoToken: string;
  workspaceId: string;
}

export interface ToolExecutorContext {
  ctx: ToolCallContext;
  undoRecord: UndoRecord;
}

export interface ToolDefinition {
  kind: "read" | "mutation";
  execute(input: unknown, context: ToolExecutorContext): Promise<unknown>;
  preview?: (input: unknown, context: ToolExecutorContext) => Promise<DiffPreview>;
  undo?: (input: unknown, context: ToolExecutorContext) => Promise<unknown>;
}

export type ToolRegistry = Record<string, ToolDefinition>;

interface ToolCallOptions {
  now?: () => Date;
  tokenFactory?: () => string;
}

interface ToolCallInput {
  actorId: string;
  arguments: unknown;
  confirmToken?: string | undefined;
  toolName?: string | undefined;
  undoToken?: string | undefined;
  workspaceId: string;
}

interface PendingConfirmation {
  actorId: string;
  diff: DiffPreview;
  input: unknown;
  toolName: string;
  workspaceId: string;
}

const DEFAULT_ACTOR_ID = "unknown";
const FORBIDDEN_STATUS = 403;
const MENU_ITEMS_COLLECTION = "carte_menu_items";
const TOOL_CALL_REDACTED_VALUE = "[REDACTED]";
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE_PATTERN = /(?:\+?\d|\(\d{3}\))[\d\s().-]{6,}\d/g;
const HTTP_URL_PROTOCOLS = new Set(["http:", "https:"]);
const LOCALHOST_NAMES = new Set(["localhost", "0.0.0.0"]);
const IPV4_MAPPED_IPV6_PREFIX = "::ffff:";
const IPV6_HEXTET_RADIX = 16;
const IPV6_UNIQUE_LOCAL_MASK = 0xfe00;
const IPV6_UNIQUE_LOCAL_PREFIX = 0xfc00;
const IPV6_LINK_LOCAL_MASK = 0xffc0;
const IPV6_LINK_LOCAL_PREFIX = 0xfe80;
const OCTET_BIT_SHIFT = 8;
const OCTET_MASK = 0xff;

/**
 * Documented KV key prefixes for tool-call state. Keep each prefix unique so
 * undo, audit, and pending-confirmation records never collide in plugin KV.
 */
export const TOOL_CALL_KV_KEY_PREFIXES = {
  audit: "audit",
  autoApprove: "tool-auto-approve",
  pendingConfirmation: "tool-confirm",
  undo: "tool-undo",
  undoStatus: "tool-undo-status",
} as const;

/**
 * Tool-call KV redaction must preserve routing/audit metadata that is not PII.
 * Any field outside this allow-list still flows through value/key PII checks
 * before being persisted to undo or audit records.
 */
export const TOOL_CALL_PII_REDACTION_EXEMPT_FIELDS = [
  "actorId",
  "after",
  "before",
  "currency",
  "id",
  "input",
  "itemId",
  "price",
  "result",
  "status",
  "timestamp",
  "toolName",
] as const;

const TOOL_CALL_PII_FIELD_NAMES = new Set([
  "address",
  "customeraddress",
  "customeremail",
  "customername",
  "customerphone",
  "email",
  "guestaddress",
  "guestemail",
  "guestname",
  "guestphone",
  "name",
  "phone",
  "postaladdress",
]);
const TOOL_CALL_PII_REDACTION_EXEMPT_FIELD_SET = new Set<string>(
  TOOL_CALL_PII_REDACTION_EXEMPT_FIELDS.map((field) => field.toLowerCase()),
);

export async function toolCallRoute(
  ctx: ToolCallContext,
  tools: ToolRegistry = defaultTools(),
  options: ToolCallOptions = {},
): Promise<Record<string, unknown>> {
  const workspaceId = requireWorkspaceId(ctx.request);
  const input = parseToolCallInput(ctx.input, workspaceId);
  if (input.undoToken !== undefined) {
    return undoMutation(ctx, tools, input, options);
  }
  const tool = toolFor(tools, input.toolName);
  if (tool.kind === "read") {
    return executeRead(tool, ctx, input);
  }
  return handleMutation(ctx, tool, input, options);
}

export async function confirmCallRoute(
  ctx: ToolCallContext,
  tools: ToolRegistry = defaultTools(),
  options: ToolCallOptions = {},
): Promise<Record<string, unknown>> {
  return toolCallRoute(ctx, tools, options);
}

export async function undoCallRoute(
  ctx: ToolCallContext,
  tools: ToolRegistry = defaultTools(),
  options: ToolCallOptions = {},
): Promise<Record<string, unknown>> {
  return toolCallRoute(ctx, tools, options);
}

export async function auditListRoute(ctx: ToolCallContext): Promise<Record<string, unknown>> {
  const workspaceId = requireWorkspaceId(ctx.request);
  const entries = await readAuditEntries(ctx.kv, auditPrefix(workspaceId));
  return { ok: true, result: { entries }, status: "listed" };
}

/**
 * Defensive SSRF guard for future tools that accept caller-supplied URLs.
 * Only HTTP(S) URLs whose hostname exactly matches an explicit allow-list entry
 * pass; localhost and private IPv4 targets are always rejected.
 */
export function isAllowedToolUrl(url: string, allowedHosts: readonly string[]): boolean {
  const parsed = parseUrl(url);
  if (parsed === null || !HTTP_URL_PROTOCOLS.has(parsed.protocol)) {
    return false;
  }
  const hostname = parsed.hostname.toLowerCase();
  return allowedHosts.includes(hostname) && !isLocalOrPrivateHost(hostname);
}

function defaultTools(): ToolRegistry {
  return {
    listMenuItems: {
      kind: "read",
      execute: async (_input, context) => context.ctx.content?.list?.("carte_menu_items") ?? [],
    },
    updateMenuItemPrice: {
      kind: "mutation",
      execute: async (input, context) => updateMenuItemPrice(input, context.ctx.content),
      preview: async (input) => priceDiff(input),
    },
  };
}

async function executeRead(
  tool: ToolDefinition,
  ctx: ToolCallContext,
  input: ToolCallInput,
): Promise<Record<string, unknown>> {
  const result = await tool.execute(input.arguments, blankExecutorContext(ctx));
  return { ok: true, result, status: "executed" };
}

async function handleMutation(
  ctx: ToolCallContext,
  tool: ToolDefinition,
  input: ToolCallInput,
  options: ToolCallOptions,
): Promise<Record<string, unknown>> {
  const autoApproved = await isAutoApproved(ctx.kv, input.workspaceId, requiredToolName(input));
  if (input.confirmToken === undefined && !autoApproved) {
    return requestConfirmation(ctx, tool, input, options);
  }
  if (input.confirmToken !== undefined) {
    const confirmation = await consumeConfirmation(ctx.kv, input);
    return executeMutation(ctx, tool, { ...input, arguments: confirmation.input }, options);
  }
  return executeMutation(ctx, tool, input, options);
}

async function requestConfirmation(
  ctx: ToolCallContext,
  tool: ToolDefinition,
  input: ToolCallInput,
  options: ToolCallOptions,
): Promise<Record<string, unknown>> {
  const diff = await previewFor(tool, ctx, input.arguments);
  const confirmToken = tokenFrom(options, "confirm");
  await writeKv(ctx.kv, confirmKey(input.workspaceId, confirmToken), pending(input, diff), {
    expirationTtl: TOOL_CONFIRMATION_TTL_SECONDS,
  });
  return { confirmToken, diff, ok: true, status: "confirmation_required" };
}

async function executeMutation(
  ctx: ToolCallContext,
  tool: ToolDefinition,
  input: ToolCallInput,
  options: ToolCallOptions,
): Promise<Record<string, unknown>> {
  const mutation = normalizeMutationResult(
    await tool.execute(input.arguments, blankExecutorContext(ctx)),
  );
  const undoToken = tokenFrom(options, "undo");
  const now = options.now?.() ?? new Date();
  await writeUndo(ctx.kv, input, mutation, undoToken, now);
  await writeAudit(ctx.kv, input, mutation, undoToken, now);
  return { ok: true, result: mutation.result, status: "executed", undoToken };
}

async function undoMutation(
  ctx: ToolCallContext,
  tools: ToolRegistry,
  input: ToolCallInput,
  options: ToolCallOptions,
): Promise<Record<string, unknown>> {
  const undoToken = requireValue(input.undoToken, "undoToken");
  const key = undoKey(input.workspaceId, undoToken);
  const undoRecord = await ctx.kv.get<UndoRecord>(key);
  if (undoRecord === null) {
    return missingUndoResponse(ctx.kv, input.workspaceId, undoToken);
  }
  const expiredAt = undoRecord.expiresAt;
  if (isExpired(expiredAt, options.now?.() ?? new Date())) {
    await markUndoExpired({ expiredAt, kv: ctx.kv, undoToken, workspaceId: input.workspaceId });
    return undoExpiredResponse(expiredAt);
  }
  const tool = toolFor(tools, undoRecord.toolName);
  if (tool.undo === undefined) {
    throw new Error(`Tool ${undoRecord.toolName} has no undo implementation.`);
  }
  const result = await tool.undo(undoRecord.input, { ctx, undoRecord });
  await markUndoCompleted({ expiredAt, kv: ctx.kv, undoToken, workspaceId: input.workspaceId });
  return { ok: true, result, status: "undone" };
}

export function validateMutationTools(tools: ToolRegistry): void {
  for (const [name, tool] of Object.entries(tools)) {
    if (tool.kind === "mutation" && typeof tool.undo !== "function") {
      throw new Error(`Mutation tool ${name} must implement undo().`);
    }
  }
}

async function consumeConfirmation(
  kv: ToolCallKv,
  input: ToolCallInput,
): Promise<PendingConfirmation> {
  const key = confirmKey(input.workspaceId, requireValue(input.confirmToken, "confirmToken"));
  const pendingConfirmation = await kv.get<PendingConfirmation>(key);
  if (pendingConfirmation === null) {
    throw new Error("Confirm token is invalid or expired.");
  }
  assertSamePendingCall(input, pendingConfirmation);
  await kv.delete?.(key);
  return pendingConfirmation;
}

function assertSamePendingCall(
  input: ToolCallInput,
  pendingConfirmation: PendingConfirmation,
): void {
  if (pendingConfirmation.toolName !== input.toolName) {
    throw new Error("Confirm token does not match the requested tool.");
  }
  if (pendingConfirmation.workspaceId !== input.workspaceId) {
    throw new Error("Confirm token does not match the workspace.");
  }
  if (pendingConfirmation.actorId !== input.actorId) {
    throw new ToolCallHttpError("Confirm token does not match the actor.", FORBIDDEN_STATUS);
  }
}

async function previewFor(
  tool: ToolDefinition,
  ctx: ToolCallContext,
  input: unknown,
): Promise<DiffPreview> {
  if (tool.preview !== undefined) {
    return tool.preview(input, blankExecutorContext(ctx));
  }
  throw new Error("Mutation tools must provide a side-effect-free preview.");
}

async function writeUndo(
  kv: ToolCallKv,
  input: ToolCallInput,
  mutation: MutationResult,
  undoToken: string,
  now: Date,
): Promise<void> {
  const persistedMutation = redactToolCallKvRecord(mutation) as MutationResult;
  const expiresAt = new Date(now.getTime() + TOOL_UNDO_TTL_SECONDS * 1000).toISOString();
  await writeKv(
    kv,
    undoKey(input.workspaceId, undoToken),
    {
      ...persistedMutation,
      expiresAt,
      input: redactToolCallKvRecord(input.arguments),
      toolName: input.toolName,
    },
    { expirationTtl: TOOL_UNDO_TTL_SECONDS },
  );
  await writeUndoStatus({
    kv,
    status: {
      expiredAt: expiresAt,
      status: "pending",
    },
    undoToken,
    workspaceId: input.workspaceId,
  });
}

async function writeAudit(
  kv: ToolCallKv,
  input: ToolCallInput,
  mutation: MutationResult,
  undoToken: string,
  now: Date,
): Promise<void> {
  await writeKv(kv, auditKey(input.workspaceId, now.toISOString(), undoToken), {
    actorId: input.actorId,
    after: redactToolCallKvRecord(mutation.after),
    before: redactToolCallKvRecord(mutation.before),
    input: { arguments: redactToolCallKvRecord(input.arguments) },
    timestamp: now.toISOString(),
    toolName: input.toolName,
  });
}

function redactToolCallKvRecord(value: unknown): unknown {
  if (typeof value === "string") {
    return redactPiiInString(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactToolCallKvRecord(item));
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, redactToolCallEntry(key, child)]),
  );
}

function redactToolCallEntry(key: string, value: unknown): unknown {
  if (isToolCallPiiField(key)) {
    return TOOL_CALL_REDACTED_VALUE;
  }
  return redactToolCallKvRecord(value);
}

function isToolCallPiiField(key: string): boolean {
  const normalized = key.toLowerCase();
  if (TOOL_CALL_PII_REDACTION_EXEMPT_FIELD_SET.has(normalized)) {
    return false;
  }
  return TOOL_CALL_PII_FIELD_NAMES.has(normalized);
}

function redactPiiInString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, TOOL_CALL_REDACTED_VALUE)
    .replace(PHONE_PATTERN, TOOL_CALL_REDACTED_VALUE);
}

async function writeKv(
  kv: ToolCallKv,
  key: string,
  value: unknown,
  options?: { expirationTtl?: number },
): Promise<void> {
  if (kv.put !== undefined) {
    await kv.put(key, value, options);
    return;
  }
  await kv.set?.(key, value, options);
}

async function isAutoApproved(
  kv: ToolCallKv,
  workspaceId: string,
  toolName: string,
): Promise<boolean> {
  return (await kv.get<boolean>(autoApproveKey(workspaceId, toolName))) === true;
}

function parseToolCallInput(input: unknown, workspaceId: string): ToolCallInput {
  const record = recordFrom(input);
  return {
    actorId: stringFrom(record.actorId, DEFAULT_ACTOR_ID),
    arguments: record.arguments,
    confirmToken: optionalString(record.confirmToken),
    toolName: optionalString(record.toolName),
    undoToken: optionalString(record.undoToken),
    workspaceId,
  };
}

function requireWorkspaceId(request: Request | undefined): string {
  const header = request?.headers.get("X-Workspace-Id") ?? null;
  if (header !== null && header.trim() !== "") {
    return header;
  }
  throw new Error("X-Workspace-Id header is required for tool-call.");
}

function normalizeMutationResult(result: unknown): MutationResult {
  const record = recordFrom(result);
  return { after: record.after, before: record.before, result: record.result };
}

function pending(input: ToolCallInput, diff: DiffPreview): PendingConfirmation {
  return {
    actorId: input.actorId,
    diff,
    input: input.arguments,
    toolName: requiredToolName(input),
    workspaceId: input.workspaceId,
  };
}

async function updateMenuItemPrice(
  input: unknown,
  content: ContentApi | undefined,
): Promise<MutationResult> {
  const record = recordFrom(input);
  const id = requireValue(optionalString(record.id), "id");
  const price = numberFrom(record.price, "price");
  const before = await currentMenuItemPrice(content, id);
  const result = await content?.update?.(MENU_ITEMS_COLLECTION, id, { price });
  return { after: { price }, before, result };
}

function priceDiff(input: unknown): DiffPreview {
  const record = recordFrom(input);
  return { after: { price: numberFrom(record.price, "price") }, before: record.before ?? null };
}

function blankExecutorContext(ctx: ToolCallContext): ToolExecutorContext {
  return { ctx, undoRecord: { after: null, before: null, input: null, toolName: "" } };
}

function toolFor(tools: ToolRegistry, toolName: string | undefined): ToolDefinition {
  const tool = tools[requireValue(toolName, "toolName")];
  if (tool === undefined) {
    throw new Error("Unknown tool.");
  }
  return tool;
}

function requiredToolName(input: ToolCallInput): string {
  return requireValue(input.toolName, "toolName");
}

function tokenFrom(options: ToolCallOptions, prefix: string): string {
  return options.tokenFactory?.() ?? `${prefix}-${crypto.randomUUID()}`;
}

function autoApproveKey(workspaceId: string, toolName: string): string {
  return `${TOOL_CALL_KV_KEY_PREFIXES.autoApprove}:${workspaceId}:${toolName}`;
}

async function readAuditEntries(kv: ToolCallKv, prefix: string): Promise<unknown[]> {
  const listing = await kv.list?.(prefix);
  if (listing === undefined) {
    return [];
  }
  return listing.map((entry) => entry.value);
}

async function missingUndoResponse(
  kv: ToolCallKv,
  workspaceId: string,
  undoToken: string,
): Promise<Record<string, unknown>> {
  const status = await kv.get<UndoStatusRecord>(undoStatusKey(workspaceId, undoToken));
  if (status?.status === "undone") {
    return { ok: true, result: null, status: "undone" };
  }
  if (status?.status === "pending") {
    return undoExpiredResponse(status.expiredAt);
  }
  throw new Error("Undo token is invalid or expired.");
}

async function markUndoCompleted(mutation: UndoStatusMutation): Promise<void> {
  await mutation.kv.delete?.(undoKey(mutation.workspaceId, mutation.undoToken));
  if (mutation.expiredAt === undefined) {
    return;
  }
  await writeUndoStatus({
    kv: mutation.kv,
    status: {
      expiredAt: mutation.expiredAt,
      status: "undone",
    },
    undoToken: mutation.undoToken,
    workspaceId: mutation.workspaceId,
  });
}

async function markUndoExpired(mutation: ExpiringUndoStatusMutation): Promise<void> {
  await mutation.kv.delete?.(undoKey(mutation.workspaceId, mutation.undoToken));
  await writeUndoStatus({
    kv: mutation.kv,
    status: {
      expiredAt: mutation.expiredAt,
      status: "pending",
    },
    undoToken: mutation.undoToken,
    workspaceId: mutation.workspaceId,
  });
}

async function writeUndoStatus(write: UndoStatusWrite): Promise<void> {
  await writeKv(write.kv, undoStatusKey(write.workspaceId, write.undoToken), write.status, {
    expirationTtl: TOOL_UNDO_STATUS_TTL_SECONDS,
  });
}

function isExpired(expiresAt: string | undefined, now: Date): expiresAt is string {
  return expiresAt !== undefined && now.getTime() > new Date(expiresAt).getTime();
}

function undoExpiredResponse(expiredAt: string): Record<string, unknown> {
  return { error: "undo_expired", expiredAt, ok: false };
}

function confirmKey(workspaceId: string, token: string): string {
  return `${TOOL_CALL_KV_KEY_PREFIXES.pendingConfirmation}:${workspaceId}:${token}`;
}

function undoKey(workspaceId: string, token: string): string {
  return `${TOOL_CALL_KV_KEY_PREFIXES.undo}:${workspaceId}:${token}`;
}

function undoStatusKey(workspaceId: string, token: string): string {
  return `${TOOL_CALL_KV_KEY_PREFIXES.undoStatus}:${workspaceId}:${token}`;
}

function auditKey(workspaceId: string, timestamp: string, undoToken: string): string {
  return `${auditPrefix(workspaceId)}${timestamp}:${undoToken}`;
}

function auditPrefix(workspaceId: string): string {
  return `${TOOL_CALL_KV_KEY_PREFIXES.audit}:${workspaceId}:`;
}

function recordFrom(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  throw new Error("Tool-call input must be an object.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function stringFrom(value: unknown, fallback: string): string {
  return optionalString(value) ?? fallback;
}

function requireValue(value: string | undefined, name: string): string {
  if (value !== undefined) {
    return value;
  }
  throw new Error(`Tool-call input requires ${name}.`);
}

function numberFrom(value: unknown, name: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  throw new Error(`Tool-call input requires numeric ${name}.`);
}

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const normalizedHostname = stripIpv6Brackets(hostname);
  if (normalizedHostname.includes(":")) {
    return isLocalOrPrivateIpv6Host(normalizedHostname);
  }
  return isLocalOrPrivateIpv4Host(normalizedHostname);
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

function isLocalOrPrivateIpv4Host(hostname: string): boolean {
  return (
    LOCALHOST_NAMES.has(hostname) ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    isPrivate172Host(hostname)
  );
}

function isLocalOrPrivateIpv6Host(hostname: string): boolean {
  const firstHextet = firstIpv6Hextet(hostname);
  return (
    hostname === "::1" ||
    isMappedLocalOrPrivateIpv4Host(hostname) ||
    (firstHextet & IPV6_UNIQUE_LOCAL_MASK) === IPV6_UNIQUE_LOCAL_PREFIX ||
    (firstHextet & IPV6_LINK_LOCAL_MASK) === IPV6_LINK_LOCAL_PREFIX
  );
}

function firstIpv6Hextet(hostname: string): number {
  const [firstSegment = ""] = hostname.split(":");
  if (firstSegment === "") {
    return 0;
  }
  return parseIpv6Hextet(firstSegment) ?? 0;
}

function isMappedLocalOrPrivateIpv4Host(hostname: string): boolean {
  if (!hostname.startsWith(IPV4_MAPPED_IPV6_PREFIX)) {
    return false;
  }
  const mappedHost = ipv4HostFromMappedIpv6Tail(hostname.slice(IPV4_MAPPED_IPV6_PREFIX.length));
  return mappedHost !== null && isLocalOrPrivateIpv4Host(mappedHost);
}

function ipv4HostFromMappedIpv6Tail(tail: string): string | null {
  if (tail.includes(".")) {
    return tail;
  }
  const [highPart, lowPart] = tail.split(":");
  if (highPart === undefined || lowPart === undefined) {
    return null;
  }
  const high = parseIpv6Hextet(highPart);
  const low = parseIpv6Hextet(lowPart);
  if (high === null || low === null) {
    return null;
  }
  return `${high >> OCTET_BIT_SHIFT}.${high & OCTET_MASK}.${low >> OCTET_BIT_SHIFT}.${low & OCTET_MASK}`;
}

function parseIpv6Hextet(value: string): number | null {
  const parsed = Number.parseInt(value, IPV6_HEXTET_RADIX);
  return Number.isNaN(parsed) ? null : parsed;
}

function isPrivate172Host(hostname: string): boolean {
  const match = /^172\.(\d{1,3})\./.exec(hostname);
  if (match === null) {
    return false;
  }
  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

async function currentMenuItemPrice(
  content: ContentApi | undefined,
  id: string,
): Promise<{ price: number } | null> {
  const items = await content?.list?.(MENU_ITEMS_COLLECTION);
  if (!Array.isArray(items)) {
    return null;
  }
  const item = items.find((candidate) => {
    const record = optionalRecordFrom(candidate);
    return record?.id === id;
  });
  const record = optionalRecordFrom(item);
  return typeof record?.price === "number" && Number.isFinite(record.price)
    ? { price: record.price }
    : null;
}

function optionalRecordFrom(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

class ToolCallHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ToolCallHttpError";
    this.status = status;
  }
}
