import { appendChatMessages, readChatHistory } from "../chat-history.js";
import type { ChatKv, ChatMessage } from "../chat-history.js";
import { prepareLlmTurn } from "../pii-boundary.js";

export type LlmStreamer = (input: {
  message: string;
  piiOptIn: boolean;
  prompt: string;
  workspaceId: string;
}) => Promise<string[]> | string[];

interface ChatRouteContext {
  input: unknown;
  kv: ChatKv;
}

interface ChatInput {
  message: string;
  userId: string;
  workspaceId: string;
  piiOptIn: boolean;
  toolContext?: unknown;
}

const SSE_HEADERS = {
  "Cache-Control": "no-cache",
  "Content-Type": "text/event-stream",
};

export async function chatStreamRoute(
  ctx: ChatRouteContext,
  streamLlm: LlmStreamer = defaultLlmStream,
): Promise<Response> {
  const input = parseChatInput(ctx.input);
  const chunks = await streamLlm({ ...input, prompt: promptFor(input) });
  const assistantMessage = chunks.join("");

  await appendChatMessages(ctx.kv, input.userId, [
    { role: "user", content: input.message },
    { role: "assistant", content: assistantMessage },
  ]);

  return new Response(formatSse(chunks), { headers: SSE_HEADERS });
}

export async function historyRoute(ctx: ChatRouteContext): Promise<{ messages: ChatMessage[] }> {
  const input = parseHistoryInput(ctx.input);
  return { messages: await readChatHistory(ctx.kv, input.userId) };
}

function promptFor(input: ChatInput): string {
  return prepareLlmTurn(input, (safeInput) => JSON.stringify(safeInput));
}

function formatSse(chunks: string[]): string {
  return chunks.map((chunk) => `data: ${chunk}\n\n`).join("");
}

function defaultLlmStream(input: { message: string }): string[] {
  return [`Carte AI received: ${input.message}`];
}

function parseChatInput(input: unknown): ChatInput {
  const record = requireRecord(input);
  return {
    message: requireString(record, "message"),
    piiOptIn: record.piiOptIn === true,
    toolContext: record.toolContext,
    userId: requireString(record, "userId"),
    workspaceId: requireString(record, "workspaceId"),
  };
}

function parseHistoryInput(input: unknown): { userId: string } {
  return { userId: requireString(requireRecord(input), "userId") };
}

function requireRecord(input: unknown): Record<string, unknown> {
  if (typeof input === "object" && input !== null) {
    return input as Record<string, unknown>;
  }
  throw new Error("Chat route input must be an object.");
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  throw new Error(`Chat route input requires ${key}.`);
}
