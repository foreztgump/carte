import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatPanel } from "./components/ChatPanel.js";
import { chatStreamRoute, historyRoute } from "./routes/chat.js";
import { prepareLlmTurn } from "./pii-boundary.js";
import type { ChatKv } from "./chat-history.js";

const userId = "user_123";
const workspaceId = "workspace_123";

const createKv = (): ChatKv & {
  entries: Map<string, unknown>;
  expirations: Map<string, number>;
} => {
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
};

const readBody = async (response: Response): Promise<string> =>
  new TextDecoder().decode(await response.arrayBuffer());

describe("ChatPanel", () => {
  it("renders history and consumes incremental SSE chunks", async () => {
    const streamChat = vi.fn(async () => sseResponse(["Hello", " chef"]));

    render(
      <ChatPanel
        fetchHistory={async () => [{ role: "assistant", content: "Previous reply" }]}
        streamChat={streamChat}
        userId={userId}
        workspaceId={workspaceId}
      />,
    );

    expect(await screen.findByText("Carte AI")).toBeInTheDocument();
    expect(await screen.findByText("Previous reply")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Draft menu copy" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByText("Hello chef")).toBeInTheDocument());
    expect(streamChat).toHaveBeenCalledWith({
      message: "Draft menu copy",
      piiOptIn: false,
      userId,
      workspaceId,
    });
  });
});

describe("chat routes", () => {
  it("serves SSE and persists user plus assistant history for 30 days", async () => {
    const kv = createKv();
    const response = await chatStreamRoute(
      workspaceRouteContext(kv, { message: "Generate specials", userId }, workspaceId),
      async () => ["Try the mushroom risotto."],
    );

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(await readBody(response)).toContain("data: Try the mushroom risotto.");
    expect(kv.expirations.get(`chat:${workspaceId}:${userId}`)).toBe(2_592_000);

    const history = await historyRoute(workspaceRouteContext(kv, { userId }, workspaceId));
    expect(history).toEqual({
      messages: [
        { role: "user", content: "Generate specials" },
        { role: "assistant", content: "Try the mushroom risotto." },
      ],
    });
  });

  it("rejects chat requests without an X-Workspace-Id header as 400", async () => {
    const kv = createKv();
    const response = await chatStreamRoute(
      routeContext(kv, { message: "hi", userId }),
      async () => ["hello"],
    );

    expect(response.status).toBe(400);
    expect(kv.entries.size).toBe(0);
  });

  it("isolates chat history across workspaces sharing the same userId", async () => {
    const kv = createKv();

    await chatStreamRoute(
      workspaceRouteContext(kv, { message: "menu A", userId }, "ws-A"),
      async () => ["reply A"],
    );
    await chatStreamRoute(
      workspaceRouteContext(kv, { message: "menu B", userId }, "ws-B"),
      async () => ["reply B"],
    );

    const historyA = await historyRoute(workspaceRouteContext(kv, { userId }, "ws-A"));
    const historyB = await historyRoute(workspaceRouteContext(kv, { userId }, "ws-B"));

    expect(historyA.messages.map((m) => m.content)).toEqual(["menu A", "reply A"]);
    expect(historyB.messages.map((m) => m.content)).toEqual(["menu B", "reply B"]);
    expect(kv.entries.has(`chat:${userId}`)).toBe(false);
  });
});

describe("PII boundary", () => {
  it("redacts PII before prompt assembly when the turn has not opted in", () => {
    const assembler = vi.fn((input: unknown) => JSON.stringify(input));
    const prompt = prepareLlmTurn(
      {
        message: "Summarize reservation notes",
        piiOptIn: false,
        toolContext: {
          guestName: "Ada Lovelace",
          email: "ada@example.com",
          phone: "+15555550123",
          notes: "Peanut allergy and anniversary",
        },
      },
      assembler,
    );

    expect(prompt).not.toContain("Ada Lovelace");
    expect(prompt).not.toContain("ada@example.com");
    expect(prompt).not.toContain("+15555550123");
    expect(prompt).not.toContain("Peanut allergy and anniversary");
    expect(assembler).toHaveBeenCalledWith(
      expect.objectContaining({
        toolContext: {
          guestName: "[redacted]",
          email: "[redacted]",
          phone: "[redacted]",
          notes: "[redacted]",
        },
      }),
    );
  });

  it("redacts PII inside the user message when piiOptIn is false", () => {
    const assembler = vi.fn((input: unknown) => JSON.stringify(input));
    const prompt = prepareLlmTurn(
      {
        message: "contact me at user@example.com about reservation 555-1234",
        piiOptIn: false,
      },
      assembler,
    );

    expect(prompt).not.toContain("user@example.com");
    expect(prompt).not.toContain("555-1234");
    expect(assembler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.not.stringContaining("user@example.com") as unknown as string,
      }),
    );
    expect(assembler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.not.stringContaining("555-1234") as unknown as string,
      }),
    );
  });

  it("passes the message through verbatim when piiOptIn is true", () => {
    const assembler = vi.fn((input: unknown) => JSON.stringify(input));
    const message = "contact me at user@example.com about reservation 555-1234";
    prepareLlmTurn({ message, piiOptIn: true }, assembler);

    expect(assembler).toHaveBeenCalledWith(expect.objectContaining({ message }));
  });
});

describe("chat route PII boundary", () => {
  it("strips PII from the message sent to the LLM when piiOptIn is false", async () => {
    const kv = createKv();
    const captured: string[] = [];
    const message = "contact me at user@example.com about reservation 555-1234";
    await chatStreamRoute(
      workspaceRouteContext(kv, { message, piiOptIn: false, userId }, workspaceId),
      async (input) => {
        captured.push(input.prompt);
        return ["ok"];
      },
    );

    expect(captured).toHaveLength(1);
    expect(captured[0]).not.toContain("user@example.com");
    expect(captured[0]).not.toContain("555-1234");
  });

  it("forwards the message verbatim to the LLM when piiOptIn is true", async () => {
    const kv = createKv();
    const captured: string[] = [];
    const message = "contact me at user@example.com about reservation 555-1234";
    await chatStreamRoute(
      workspaceRouteContext(kv, { message, piiOptIn: true, userId }, workspaceId),
      async (input) => {
        captured.push(input.prompt);
        return ["ok"];
      },
    );

    expect(captured).toHaveLength(1);
    expect(captured[0]).toContain("user@example.com");
    expect(captured[0]).toContain("555-1234");
  });
});

function routeContext(kv: ChatKv, input: Record<string, unknown>) {
  return {
    input,
    kv,
    request: new Request("https://carte.test/_emdash/api/plugins/carte-ai/chat-stream", {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  };
}

function workspaceRouteContext(kv: ChatKv, input: Record<string, unknown>, workspaceId: string) {
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

function sseResponse(chunks: string[]): Response {
  return new Response(chunks.map((chunk) => `data: ${chunk}\n\n`).join(""), {
    headers: { "Content-Type": "text/event-stream" },
  });
}
