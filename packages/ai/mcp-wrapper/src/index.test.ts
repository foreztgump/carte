import { describe, expect, it, vi } from "vitest";

import { DEFAULT_PLUGIN_ROUTE_BASE, handleMcpRequest } from "./index.js";

describe("MCP wrapper Worker", () => {
  it("lists Carte AI tools exposed by plugin routes", async () => {
    const response = await handleMcpRequest(jsonRpcRequest({ method: "tools/list" }), env());

    await expect(response.json()).resolves.toMatchObject({
      id: 1,
      jsonrpc: "2.0",
      result: {
        tools: [
          {
            name: "listMenuItems",
            description: expect.stringContaining("Read"),
          },
          {
            name: "updateMenuItemPrice",
            description: expect.stringContaining("confirm"),
          },
        ],
      },
    });
  });

  it("proxies tool calls to the Carte AI plugin route", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: true, status: "executed" }));
    const request = jsonRpcRequest({
      method: "tools/call",
      params: { arguments: { workspaceId: "ws-1" }, name: "listMenuItems" },
    });

    const response = await handleMcpRequest(request, env({ fetcher }));

    await expect(response.json()).resolves.toEqual({
      id: 1,
      jsonrpc: "2.0",
      result: { content: [{ text: '{"ok":true,"status":"executed"}', type: "text" }] },
    });
    expect(fetcher).toHaveBeenCalledWith(`${DEFAULT_PLUGIN_ROUTE_BASE}/tool-call`, {
      body: JSON.stringify({
        arguments: { workspaceId: "ws-1" },
        toolName: "listMenuItems",
        workspaceId: "default",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  });
});

function jsonRpcRequest(body: unknown): Request {
  return new Request("https://mcp.carte.test/mcp", {
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", ...body }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    EM_DASH_PLUGIN_BASE_URL: DEFAULT_PLUGIN_ROUTE_BASE,
    MCP_SHARED_SECRET: "local-dev",
    ...overrides,
  };
}
