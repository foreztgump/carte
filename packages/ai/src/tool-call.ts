export const TOOL_CONFIRMATION_TTL_SECONDS = 600;
export const TOOL_UNDO_TTL_SECONDS = 600;

export interface ToolCallKv {
  get<T>(key: string): Promise<T | null>;
  put?: (key: string, value: unknown, options?: { expirationTtl?: number }) => Promise<void>;
  set?: (key: string, value: unknown) => Promise<void>;
  delete?: (key: string) => Promise<boolean | void>;
}

export interface ToolCallContext {
  input: unknown;
  kv: ToolCallKv;
  content?: ContentApi;
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
  input: unknown;
  toolName: string;
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
const DEFAULT_WORKSPACE_ID = "default";

export async function toolCallRoute(
  ctx: ToolCallContext,
  tools: ToolRegistry = defaultTools(),
  options: ToolCallOptions = {},
): Promise<Record<string, unknown>> {
  const input = parseToolCallInput(ctx.input);
  if (input.undoToken !== undefined) {
    return undoMutation(ctx, tools, input);
  }
  const tool = toolFor(tools, input.toolName);
  if (tool.kind === "read") {
    return executeRead(tool, ctx, input);
  }
  return handleMutation(ctx, tool, input, options);
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
  await writeUndo(ctx.kv, input, mutation, undoToken);
  await writeAudit(ctx.kv, input, mutation, undoToken, options.now?.() ?? new Date());
  return { ok: true, result: mutation.result, status: "executed", undoToken };
}

async function undoMutation(
  ctx: ToolCallContext,
  tools: ToolRegistry,
  input: ToolCallInput,
): Promise<Record<string, unknown>> {
  const undoToken = requireValue(input.undoToken, "undoToken");
  const key = undoKey(input.workspaceId, undoToken);
  const undoRecord = await ctx.kv.get<UndoRecord>(key);
  if (undoRecord === null) {
    throw new Error("Undo token is invalid or expired.");
  }
  await ctx.kv.delete?.(key);
  const tool = toolFor(tools, undoRecord.toolName);
  const result = await tool.undo?.(undoRecord.input, { ctx, undoRecord });
  return { ok: true, result, status: "undone" };
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
): Promise<void> {
  await writeKv(
    kv,
    undoKey(input.workspaceId, undoToken),
    { ...mutation, input: input.arguments, toolName: input.toolName },
    { expirationTtl: TOOL_UNDO_TTL_SECONDS },
  );
}

async function writeAudit(
  kv: ToolCallKv,
  input: ToolCallInput,
  mutation: MutationResult,
  undoToken: string,
  now: Date,
): Promise<void> {
  await writeKv(kv, `audit:${input.workspaceId}:${now.toISOString()}:${undoToken}`, {
    actorId: input.actorId,
    after: mutation.after,
    before: mutation.before,
    timestamp: now.toISOString(),
    toolName: input.toolName,
  });
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
  await kv.set?.(key, value);
}

async function isAutoApproved(
  kv: ToolCallKv,
  workspaceId: string,
  toolName: string,
): Promise<boolean> {
  return (await kv.get<boolean>(autoApproveKey(workspaceId, toolName))) === true;
}

function parseToolCallInput(input: unknown): ToolCallInput {
  const record = recordFrom(input);
  return {
    actorId: stringFrom(record.actorId, DEFAULT_ACTOR_ID),
    arguments: record.arguments,
    confirmToken: optionalString(record.confirmToken),
    toolName: optionalString(record.toolName),
    undoToken: optionalString(record.undoToken),
    workspaceId: stringFrom(record.workspaceId, DEFAULT_WORKSPACE_ID),
  };
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
  const result = await content?.update?.("carte_menu_items", id, { price });
  return { ...priceDiff(input), result };
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
  return `tool-auto-approve:${workspaceId}:${toolName}`;
}

function confirmKey(workspaceId: string, token: string): string {
  return `tool-confirm:${workspaceId}:${token}`;
}

function undoKey(workspaceId: string, token: string): string {
  return `tool-undo:${workspaceId}:${token}`;
}

function recordFrom(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  throw new Error("Tool-call input must be an object.");
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
