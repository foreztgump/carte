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
      routeContext(kv, { message: "Generate specials", userId, workspaceId }),
      async () => ["Try the mushroom risotto."],
    );

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(await readBody(response)).toContain("data: Try the mushroom risotto.");
    expect(kv.expirations.get(`chat:${userId}`)).toBe(2_592_000);

    const history = await historyRoute(routeContext(kv, { userId }));
    expect(history).toEqual({
      messages: [
        { role: "user", content: "Generate specials" },
        { role: "assistant", content: "Try the mushroom risotto." },
      ],
    });
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
});

function routeContext(kv: ChatKv, input: Record<string, unknown>) {
  return { input, kv };
}

function sseResponse(chunks: string[]): Response {
  return new Response(chunks.map((chunk) => `data: ${chunk}\n\n`).join(""), {
    headers: { "Content-Type": "text/event-stream" },
  });
}
