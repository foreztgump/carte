import { describe, expect, it } from "vitest";

import {
  CHAT_RETENTION_SECONDS,
  appendChatMessages,
  readChatHistory,
  type ChatKv,
  type ChatMessage,
} from "./chat-history.js";

const userId = "user_shared";

interface AppendArgs {
  workspaceId: string;
  newMessages: ChatMessage[];
}

const append = (kv: ChatKv, args: AppendArgs): Promise<ChatMessage[]> =>
  // Signature: (kv, workspaceId, userId, messages) — exercised so the RED test
  // documents the workspace-scoped contract that GREEN must implement.
  (
    appendChatMessages as unknown as (
      kv: ChatKv,
      workspaceId: string,
      userId: string,
      newMessages: ChatMessage[],
    ) => Promise<ChatMessage[]>
  )(kv, args.workspaceId, userId, args.newMessages);

const read = (kv: ChatKv, workspaceId: string): Promise<ChatMessage[]> =>
  (
    readChatHistory as unknown as (
      kv: ChatKv,
      workspaceId: string,
      userId: string,
    ) => Promise<ChatMessage[]>
  )(kv, workspaceId, userId);

describe("chat history KV scoping", () => {
  it("scopes chat KV keys by workspace id and isolates history across workspaces", async () => {
    const kv = createKv();

    const wsAMessages: ChatMessage[] = [
      { role: "user", content: "ws-A message" },
      { role: "assistant", content: "ws-A reply" },
    ];
    const wsBMessages: ChatMessage[] = [
      { role: "user", content: "ws-B message" },
      { role: "assistant", content: "ws-B reply" },
    ];

    await append(kv, { workspaceId: "ws-A", newMessages: wsAMessages });
    await append(kv, { workspaceId: "ws-B", newMessages: wsBMessages });

    expect(await read(kv, "ws-A")).toEqual(wsAMessages);
    expect(await read(kv, "ws-B")).toEqual(wsBMessages);

    expect(kv.entries.has(`chat:${userId}`)).toBe(false);
    expect(kv.expirations.get(`chat:ws-A:${userId}`)).toBe(CHAT_RETENTION_SECONDS);
    expect(kv.expirations.get(`chat:ws-B:${userId}`)).toBe(CHAT_RETENTION_SECONDS);
  });
});

interface MemoryKv extends ChatKv {
  entries: Map<string, unknown>;
  expirations: Map<string, number>;
}

function createKv(): MemoryKv {
  const entries = new Map<string, unknown>();
  const expirations = new Map<string, number>();
  return {
    entries,
    expirations,
    async get<T>(key: string): Promise<T | null> {
      return (entries.get(key) as T | undefined) ?? null;
    },
    async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
      entries.set(key, value);
      if (options?.expirationTtl !== undefined) {
        expirations.set(key, options.expirationTtl);
      }
    },
  };
}
