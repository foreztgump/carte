import { describe, expect, it } from "vitest";

import type { ChatKv } from "./chat-history.js";
import { chatStreamRoute } from "./routes/chat.js";

const userId = "user_123";
const workspaceId = "workspace_123";
const piiMessage = "Email guest@example.com or call 555-123-4567";
const piiPatterns = [
  { name: "email", pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/ },
  { name: "phone", pattern: /\+?\d[\d\s().-]{6,}\d/ },
];

describe("PII KV egress discipline", () => {
  it("prevents non-opted-in chat turns from writing literal PII to KV", async () => {
    const kv = createCapturingKv();

    await chatStreamRoute(
      workspaceRouteContext(kv, { message: piiMessage, piiOptIn: false, userId }),
      async () => ["ok"],
    );

    expect(findPiiWrites(kv.writes)).toEqual([]);
  });

  it("redacts chat-history KV when piiOptIn is false and preserves it when true", async () => {
    const redactedKv = createCapturingKv();
    const rawKv = createCapturingKv();

    await chatStreamRoute(
      workspaceRouteContext(redactedKv, { message: piiMessage, piiOptIn: false, userId }),
      async () => ["ok"],
    );
    await chatStreamRoute(
      workspaceRouteContext(rawKv, { message: piiMessage, piiOptIn: true, userId }),
      async () => ["ok"],
    );

    expect(serializedValues(redactedKv.writes)).not.toContain("guest@example.com");
    expect(serializedValues(redactedKv.writes)).not.toContain("555-123-4567");
    expect(serializedValues(rawKv.writes)).toContain("guest@example.com");
    expect(serializedValues(rawKv.writes)).toContain("555-123-4567");
  });
});

interface CapturedWrite {
  key: string;
  value: unknown;
}

interface CapturingKv extends ChatKv {
  entries: Map<string, unknown>;
  writes: CapturedWrite[];
}

function createCapturingKv(): CapturingKv {
  const entries = new Map<string, unknown>();
  const writes: CapturedWrite[] = [];
  return {
    entries,
    writes,
    async get<T>(key: string): Promise<T | null> {
      return (entries.get(key) as T | undefined) ?? null;
    },
    async put(key: string, value: unknown): Promise<void> {
      writes.push({ key, value });
      entries.set(key, value);
    },
  };
}

function workspaceRouteContext(kv: ChatKv, input: Record<string, unknown>) {
  return {
    input,
    kv,
    request: new Request("https://carte.test/_emdash/api/plugins/carte-ai/chat-stream", {
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Id": workspaceId,
      },
      method: "POST",
    }),
  };
}

function findPiiWrites(writes: CapturedWrite[]): CapturedWrite[] {
  return writes.filter((write) =>
    piiPatterns.some(({ pattern }) => pattern.test(JSON.stringify(write.value))),
  );
}

function serializedValues(writes: CapturedWrite[]): string {
  return writes.map((write) => JSON.stringify(write.value)).join("\n");
}
