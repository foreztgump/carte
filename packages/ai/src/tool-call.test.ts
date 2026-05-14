import { describe, expect, it, vi } from "vitest";

import { toolCallRoute, validateMutationTools } from "./tool-call.js";
import type { ContentApi, ToolCallKv, ToolDefinition, ToolExecutorContext } from "./tool-call.js";

interface StoredValue {
  value: unknown;
  expirationTtl?: number | undefined;
}

class MemoryKv implements ToolCallKv {
  readonly entries = new Map<string, StoredValue>();

  async get<T>(key: string): Promise<T | null> {
    return (this.entries.get(key)?.value as T | undefined) ?? null;
  }

  async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
    this.entries.set(key, { value, expirationTtl: options?.expirationTtl });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }
}

const readTool = {
  kind: "read",
  execute: vi.fn(async () => ({ items: [{ id: "item-1", name: "Risotto" }] })),
} satisfies ToolDefinition;

function priceTool(state: { price: number }): ToolDefinition {
  return {
    kind: "mutation",
    async preview(input: unknown) {
      const { price } = input as { price: number };
      return { before: { price: state.price }, after: { price } };
    },
    async execute(input: unknown) {
      const { price } = input as { price: number };
      const before = { price: state.price };
      state.price = price;
      return { before, after: { price } };
    },
    async undo(_input: unknown, context: ToolExecutorContext) {
      const before = context.undoRecord.before as { price: number };
      state.price = before.price;
      return { restored: before };
    },
  };
}

describe("toolCallRoute", () => {
  it("executes read tools without asking for confirmation", async () => {
    const response = await toolCallRoute(
      ctx({ toolName: "listMenuItems" }),
      { listMenuItems: readTool },
      { tokenFactory: () => "unused" },
    );

    expect(response).toEqual({
      ok: true,
      status: "executed",
      result: { items: [{ id: "item-1", name: "Risotto" }] },
    });
  });

  it("returns a diff preview and does not mutate writes before confirmation", async () => {
    const kv = new MemoryKv();
    const state = { price: 12 };

    const response = await toolCallRoute(
      ctx({ arguments: { price: 14 }, kv, toolName: "updateMenuItemPrice" }),
      { updateMenuItemPrice: priceTool(state) },
      { tokenFactory: () => "confirm-1" },
    );

    expect(state.price).toBe(12);
    expect(response).toMatchObject({
      confirmToken: "confirm-1",
      diff: { after: { price: 14 }, before: { price: 12 } },
      ok: true,
      status: "confirmation_required",
    });
    expect(kv.entries.get("tool-confirm:workspace-1:confirm-1")?.expirationTtl).toBe(600);
  });

  it("executes confirmed writes, audits them, and returns a ten-minute undo token", async () => {
    const kv = new MemoryKv();
    const state = { price: 12 };
    const tools = { updateMenuItemPrice: priceTool(state) };

    await toolCallRoute(
      ctx({
        arguments: { price: 14 },
        kv,
        toolName: "updateMenuItemPrice",
      }),
      tools,
      { tokenFactory: () => "confirm-1" },
    );
    const response = await toolCallRoute(
      ctx({
        arguments: { price: 14 },
        confirmToken: "confirm-1",
        kv,
        toolName: "updateMenuItemPrice",
      }),
      tools,
      { now: () => new Date("2026-05-08T12:00:00.000Z"), tokenFactory: () => "undo-1" },
    );

    expect(state.price).toBe(14);
    expect(response).toMatchObject({ ok: true, status: "executed", undoToken: "undo-1" });
    expect(kv.entries.get("tool-confirm:workspace-1:confirm-1")).toBeUndefined();
    expect(kv.entries.get("tool-undo:workspace-1:undo-1")?.expirationTtl).toBe(600);
    expect(
      kv.entries.get("audit:workspace-1:2026-05-08T12:00:00.000Z:undo-1")?.value,
    ).toMatchObject({
      actorId: "user-1",
      after: { price: 14 },
      before: { price: 12 },
      toolName: "updateMenuItemPrice",
    });
  });

  it("rejects confirmation from a different actor in the same workspace with 403", async () => {
    const kv = new MemoryKv();
    const state = { price: 12 };
    const tools = { updateMenuItemPrice: priceTool(state) };

    await toolCallRoute(
      ctx({ actorId: "user-1", arguments: { price: 14 }, kv, toolName: "updateMenuItemPrice" }),
      tools,
      { tokenFactory: () => "confirm-1" },
    );

    await expect(
      toolCallRoute(
        ctx({
          actorId: "user-2",
          arguments: { price: 14 },
          confirmToken: "confirm-1",
          kv,
          toolName: "updateMenuItemPrice",
        }),
        tools,
        { tokenFactory: () => "undo-1" },
      ),
    ).rejects.toMatchObject({
      message: "Confirm token does not match the actor.",
      status: 403,
    });
    expect(state.price).toBe(12);
    expect(kv.entries.has("tool-confirm:workspace-1:confirm-1")).toBe(true);
  });

  it("overwrites stale client-supplied priceDiff.before with current content at confirmation", async () => {
    const kv = new MemoryKv();
    const item = { id: "menu-item-1", price: 12 };
    const content = {
      async list(collection: string) {
        expect(collection).toBe("carte_menu_items");
        return [item];
      },
      async update(collection: string, id: string, patch: Record<string, unknown>) {
        expect(collection).toBe("carte_menu_items");
        expect(id).toBe(item.id);
        Object.assign(item, patch);
        return item;
      },
    };

    await toolCallRoute(
      ctx({
        arguments: { before: { price: 1 }, id: item.id, price: 14 },
        content,
        kv,
        toolName: "updateMenuItemPrice",
      }),
      undefined,
      { tokenFactory: () => "confirm-1" },
    );
    item.price = 13;

    await toolCallRoute(
      ctx({
        arguments: { before: { price: 1 }, id: item.id, price: 14 },
        confirmToken: "confirm-1",
        content,
        kv,
        toolName: "updateMenuItemPrice",
      }),
      undefined,
      { now: () => new Date("2026-05-08T12:00:00.000Z"), tokenFactory: () => "undo-1" },
    );

    expect(kv.entries.get("tool-undo:workspace-1:undo-1")?.value).toMatchObject({
      after: { price: 14 },
      before: { price: 13 },
    });
    expect(
      kv.entries.get("audit:workspace-1:2026-05-08T12:00:00.000Z:undo-1")?.value,
    ).toMatchObject({
      after: { price: 14 },
      before: { price: 13 },
    });
  });

  it("consumes undo tokens once and restores the previous value", async () => {
    const kv = new MemoryKv();
    const state = { price: 12 };
    const tools = { updateMenuItemPrice: priceTool(state) };

    await toolCallRoute(
      ctx({ arguments: { price: 14 }, kv, toolName: "updateMenuItemPrice" }),
      tools,
      { tokenFactory: () => "confirm-1" },
    );
    await toolCallRoute(
      ctx({
        arguments: { price: 14 },
        confirmToken: "confirm-1",
        kv,
        toolName: "updateMenuItemPrice",
      }),
      tools,
      { tokenFactory: () => "undo-1" },
    );
    const response = await toolCallRoute(ctx({ kv, undoToken: "undo-1" }), tools);

    expect(response).toEqual({ ok: true, result: { restored: { price: 12 } }, status: "undone" });
    expect(state.price).toBe(12);
    expect(kv.entries.get("tool-undo:workspace-1:undo-1")).toBeUndefined();
  });

  it("rejects undo when the registered tool has no undo implementation", async () => {
    const kv = new MemoryKv();
    const tools = {
      updateMenuItemPrice: {
        kind: "mutation",
        async preview() {
          return { before: null, after: null };
        },
        async execute() {
          return { before: null, after: null };
        },
      } satisfies ToolDefinition,
    };
    await kv.put("tool-undo:workspace-1:undo-orphan", {
      after: { price: 14 },
      before: { price: 12 },
      input: { price: 14 },
      result: null,
      toolName: "updateMenuItemPrice",
    });

    await expect(toolCallRoute(ctx({ kv, undoToken: "undo-orphan" }), tools)).rejects.toThrow(
      /no undo implementation/i,
    );
  });

  it("surfaces undo failures instead of returning ok when undo throws", async () => {
    const kv = new MemoryKv();
    const tools = {
      updateMenuItemPrice: {
        kind: "mutation",
        async preview() {
          return { before: null, after: null };
        },
        async execute() {
          return { before: null, after: null };
        },
        async undo() {
          throw new Error("downstream KV unavailable");
        },
      } satisfies ToolDefinition,
    };
    await kv.put("tool-undo:workspace-1:undo-fail", {
      after: { price: 14 },
      before: { price: 12 },
      input: { price: 14 },
      result: null,
      toolName: "updateMenuItemPrice",
    });

    await expect(toolCallRoute(ctx({ kv, undoToken: "undo-fail" }), tools)).rejects.toThrow(
      /downstream KV unavailable/,
    );
  });

  it("validates at registration time that mutation tools provide an undo function", () => {
    const tools = {
      updateMenuItemPrice: {
        kind: "mutation",
        async preview() {
          return { before: null, after: null };
        },
        async execute() {
          return { before: null, after: null };
        },
      } satisfies ToolDefinition,
    };

    expect(() => validateMutationTools(tools)).toThrow(/undo/);
  });

  it("validates passes when every mutation tool defines undo", () => {
    const tools = { updateMenuItemPrice: priceTool({ price: 12 }) };
    expect(() => validateMutationTools(tools)).not.toThrow();
  });

  it("rejects requests without an X-Workspace-Id header instead of falling back to 'default'", async () => {
    const kv = new MemoryKv();
    const noHeaderCtx = {
      input: { actorId: "user-1", toolName: "listMenuItems" },
      kv,
      request: new Request("https://carte.test/_emdash/api/plugins/carte-ai/tool-call", {
        method: "POST",
      }),
    };

    await expect(
      toolCallRoute(noHeaderCtx, { listMenuItems: readTool }, { tokenFactory: () => "unused" }),
    ).rejects.toThrow(/X-Workspace-Id/);
    expect(kv.entries.has("tool-confirm:default:unused")).toBe(false);
  });

  it("ignores body-supplied workspaceId and uses only the X-Workspace-Id header", async () => {
    const kv = new MemoryKv();
    const state = { price: 12 };
    const tools = { updateMenuItemPrice: priceTool(state) };

    await toolCallRoute(
      {
        input: {
          actorId: "user-1",
          arguments: { price: 14 },
          toolName: "updateMenuItemPrice",
          workspaceId: "workspace-attacker",
        },
        kv,
        request: new Request("https://carte.test/_emdash/api/plugins/carte-ai/tool-call", {
          headers: { "X-Workspace-Id": "workspace-victim" },
          method: "POST",
        }),
      },
      tools,
      { tokenFactory: () => "confirm-1" },
    );

    expect(kv.entries.has("tool-confirm:workspace-victim:confirm-1")).toBe(true);
    expect(kv.entries.has("tool-confirm:workspace-attacker:confirm-1")).toBe(false);
  });

  it("uses workspace-and-tool scoped auto-approve keys, never global keys", async () => {
    const kv = new MemoryKv();
    const state = { price: 12 };
    await kv.put("tool-auto-approve:workspace-1:updateMenuItemPrice", true);

    const response = await toolCallRoute(
      ctx({ arguments: { price: 14 }, kv, toolName: "updateMenuItemPrice" }),
      { updateMenuItemPrice: priceTool(state) },
      { tokenFactory: () => "undo-1" },
    );

    expect(response).toMatchObject({ ok: true, status: "executed", undoToken: "undo-1" });
    expect(kv.entries.has("tool-auto-approve:updateMenuItemPrice")).toBe(false);
  });
});

function ctx(input: {
  actorId?: string;
  arguments?: unknown;
  confirmToken?: string;
  content?: ContentApi;
  kv?: ToolCallKv;
  toolName?: string;
  undoToken?: string;
  workspaceId?: string;
}) {
  const workspaceId = input.workspaceId ?? "workspace-1";
  const context = {
    input: {
      arguments: input.arguments,
      actorId: input.actorId ?? "user-1",
      confirmToken: input.confirmToken,
      toolName: input.toolName,
      undoToken: input.undoToken,
    },
    kv: input.kv ?? new MemoryKv(),
    request: new Request("https://carte.test/_emdash/api/plugins/carte-ai/tool-call", {
      headers: { "X-Workspace-Id": workspaceId },
      method: "POST",
    }),
  };
  return input.content === undefined ? context : { ...context, content: input.content };
}
