import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InlineAiActions } from "./components/InlineAiActions.js";
import { createInlineAiTools } from "./inline-tools.js";
import { toolCallRoute } from "./tool-call.js";
import type { ToolCallKv } from "./tool-call.js";

class MemoryKv implements ToolCallKv {
  readonly entries = new Map<string, { value: unknown; expirationTtl?: number }>();

  async get<T>(key: string): Promise<T | null> {
    return (this.entries.get(key)?.value as T | undefined) ?? null;
  }

  async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
    const stored =
      options?.expirationTtl === undefined
        ? { value }
        : { value, expirationTtl: options.expirationTtl };
    this.entries.set(key, stored);
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }
}

const menuItem = {
  id: "item-1",
  name: "Peanut Satay Noodles",
  ingredients: ["wheat noodles", "peanut sauce", "soy"],
  description: "Noodles with peanut sauce and soy.",
  allergens: [],
  altText: "",
};

describe("InlineAiActions", () => {
  // TODO(PRO-764): Quarantined under v0.2 tender-adapter mission. Fails with
  // `Cannot read properties of null (reading 'useState')` on first render — React 19.2.6
  // dispatcher null-init issue under jsdom + Vitest. Reproduces on v0.1 baseline (3a40f3f).
  // Re-enable once root cause is fixed (likely React/RTL upgrade or single-instance dedupe).
  it.skip("surfaces a diff preview before applying generated descriptions", async () => {
    const toolCall = vi.fn(async () => ({
      ok: true,
      status: "confirmation_required",
      confirmToken: "confirm-description",
      diff: {
        before: { description: "" },
        after: { description: "Peanut Satay Noodles with wheat noodles and peanut sauce." },
      },
    }));

    render(
      <InlineAiActions
        actorId="chef-1"
        item={{ ...menuItem, description: "" }}
        toolCall={toolCall}
        workspaceId="workspace-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate description with AI" }));

    expect(await screen.findByText("AI diff preview")).toBeInTheDocument();
    expect(
      screen.getByText("Peanut Satay Noodles with wheat noodles and peanut sauce."),
    ).toBeInTheDocument();
    expect(toolCall).toHaveBeenCalledWith({
      actorId: "chef-1",
      arguments: expect.objectContaining({ id: "item-1" }),
      toolName: "updateMenuItemDescription",
      workspaceId: "workspace-1",
    });
  });

  it("writes an HR9 audit entry when confirmed allergen suggestions change tags", async () => {
    const kv = new MemoryKv();
    const updates: unknown[] = [];
    const tools = createInlineAiTools({
      content: {
        update: async (_collection, _id, patch) => {
          updates.push(patch);
          return { ok: true };
        },
      },
    });

    const preview = await toolCallRoute(
      ctx(kv, { arguments: menuItem, toolName: "suggestMenuItemAllergens" }),
      tools,
      { tokenFactory: () => "confirm-allergens" },
    );
    const response = await toolCallRoute(
      ctx(kv, {
        arguments: menuItem,
        confirmToken: "confirm-allergens",
        toolName: "suggestMenuItemAllergens",
      }),
      tools,
      { now: () => new Date("2026-05-08T12:00:00.000Z"), tokenFactory: () => "undo-allergens" },
    );

    expect(preview).toMatchObject({
      status: "confirmation_required",
      diff: { after: { allergens: ["peanuts", "soybeans"] } },
    });
    expect(response).toMatchObject({ ok: true, status: "executed" });
    expect(updates).toEqual([{ allergens: ["peanuts", "soybeans"] }]);
    expect(
      kv.entries.get("audit:workspace-1:2026-05-08T12:00:00.000Z:undo-allergens")?.value,
    ).toMatchObject({
      actorId: "chef-1",
      after: { allergens: ["peanuts", "soybeans"] },
      before: { allergens: [] },
      toolName: "suggestMenuItemAllergens",
    });
  });

  it("redacts PII from translate prompts unless the user opted in for that turn", async () => {
    const translate = vi.fn((prompt: string) => `Translated: ${prompt}`);
    const tools = createInlineAiTools({ llm: { translate } });

    await toolCallRoute(
      ctx(new MemoryKv(), {
        arguments: {
          ...menuItem,
          targetLocale: "es",
          piiOptIn: false,
          toolContext: {
            guestName: "Ada Lovelace",
            email: "ada@example.com",
            notes: "VIP anniversary dinner",
          },
        },
        toolName: "translateMenuItem",
      }),
      tools,
      { tokenFactory: () => "confirm-translate" },
    );

    await waitFor(() => expect(translate).toHaveBeenCalled());
    const prompt = translate.mock.calls[0]?.[0] ?? "";
    expect(prompt).not.toContain("Ada Lovelace");
    expect(prompt).not.toContain("ada@example.com");
    expect(prompt).not.toContain("VIP anniversary dinner");
    expect(prompt).toContain("[redacted]");
  });

  it("redacts PII from describe inputs unless the user opted in for that turn", async () => {
    const describe = vi.fn((input: { toolContext?: unknown }) => {
      const context = JSON.stringify(input.toolContext);
      return `Generated: ${context}`;
    });
    const tools = createInlineAiTools({ llm: { describe } });

    await toolCallRoute(
      ctx(new MemoryKv(), {
        arguments: {
          ...menuItem,
          piiOptIn: false,
          toolContext: {
            guestName: "Ada Lovelace",
            email: "ada@example.com",
            notes: "VIP anniversary dinner",
          },
        },
        toolName: "updateMenuItemDescription",
      }),
      tools,
      { tokenFactory: () => "confirm-description" },
    );

    await waitFor(() => expect(describe).toHaveBeenCalled());
    const sanitizedInput = describe.mock.calls[0]?.[0];
    const serialized = JSON.stringify(sanitizedInput);
    expect(serialized).not.toContain("Ada Lovelace");
    expect(serialized).not.toContain("ada@example.com");
    expect(serialized).not.toContain("VIP anniversary dinner");
    expect(serialized).toContain("[redacted]");
  });

  it("passes PII through to describe when the user opted in for that turn", async () => {
    const describe = vi.fn((input: { toolContext?: unknown }) => `ok-${typeof input}`);
    const tools = createInlineAiTools({ llm: { describe } });

    await toolCallRoute(
      ctx(new MemoryKv(), {
        arguments: {
          ...menuItem,
          piiOptIn: true,
          toolContext: { guestName: "Ada Lovelace" },
        },
        toolName: "updateMenuItemDescription",
      }),
      tools,
      { tokenFactory: () => "confirm-description-optin" },
    );

    await waitFor(() => expect(describe).toHaveBeenCalled());
    const sanitizedInput = describe.mock.calls[0]?.[0];
    expect(JSON.stringify(sanitizedInput)).toContain("Ada Lovelace");
  });

  it("redacts PII from generateAltText inputs unless the user opted in for that turn", async () => {
    const generateAltText = vi.fn((input: { toolContext?: unknown }) => `alt-${typeof input}`);
    const tools = createInlineAiTools({ llm: { generateAltText } });

    await toolCallRoute(
      ctx(new MemoryKv(), {
        arguments: {
          ...menuItem,
          toolContext: { email: "ada@example.com", phone: "+15555555555" },
        },
        toolName: "generateMenuItemAltText",
      }),
      tools,
      { tokenFactory: () => "confirm-alt" },
    );

    await waitFor(() => expect(generateAltText).toHaveBeenCalled());
    const sanitizedInput = generateAltText.mock.calls[0]?.[0];
    const serialized = JSON.stringify(sanitizedInput);
    expect(serialized).not.toContain("ada@example.com");
    expect(serialized).not.toContain("+15555555555");
    expect(serialized).toContain("[redacted]");
  });
});

function ctx(
  kv: ToolCallKv,
  input: {
    arguments?: unknown;
    confirmToken?: string;
    toolName?: string;
  },
) {
  return {
    input: {
      actorId: "chef-1",
      arguments: input.arguments,
      confirmToken: input.confirmToken,
      toolName: input.toolName,
    },
    kv,
    request: new Request("https://carte.test/_emdash/api/plugins/carte-ai/tool-call", {
      headers: { "X-Workspace-Id": "workspace-1" },
      method: "POST",
    }),
  };
}
