export const CHAT_RETENTION_SECONDS = 2_592_000;

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatKv {
  get<T>(key: string): Promise<T | null>;
  put?: (key: string, value: unknown, options?: { expirationTtl?: number }) => Promise<void>;
  set?: (key: string, value: unknown) => Promise<void>;
}

const chatKey = (userId: string) => `chat:${userId}`;

export async function readChatHistory(kv: ChatKv, userId: string): Promise<ChatMessage[]> {
  return (await kv.get<ChatMessage[]>(chatKey(userId))) ?? [];
}

export async function appendChatMessages(
  kv: ChatKv,
  userId: string,
  newMessages: ChatMessage[],
): Promise<ChatMessage[]> {
  const messages = [...(await readChatHistory(kv, userId)), ...newMessages];
  await writeKv(kv, chatKey(userId), messages, CHAT_RETENTION_SECONDS);
  return messages;
}

async function writeKv(
  kv: ChatKv,
  key: string,
  value: unknown,
  expirationTtl: number,
): Promise<void> {
  if (kv.put !== undefined) {
    await kv.put(key, value, { expirationTtl });
    return;
  }
  await kv.set?.(key, value);
}
