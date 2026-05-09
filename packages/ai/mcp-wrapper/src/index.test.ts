import { describe, expect, it, vi } from "vitest";

import type { Env } from "./index.js";
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

  it("proxies tool calls to the Carte AI plugin route with the request workspace", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: true, status: "executed" }));
    const request = jsonRpcRequest(
      {
        method: "tools/call",
        params: { arguments: {}, name: "listMenuItems" },
      },
      { workspaceId: "ws-1" },
    );

    const response = await handleMcpRequest(request, env({ fetcher }));

    await expect(response.json()).resolves.toEqual({
      id: 1,
      jsonrpc: "2.0",
      result: { content: [{ text: '{"ok":true,"status":"executed"}', type: "text" }] },
    });
    expect(fetcher).toHaveBeenCalledWith(`${DEFAULT_PLUGIN_ROUTE_BASE}/tool-call`, {
      body: JSON.stringify({
        arguments: {},
        toolName: "listMenuItems",
        workspaceId: "ws-1",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  });

  it("rejects tools/call with no X-Workspace-Id header as 400", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: true }));
    const response = await handleMcpRequest(
      new Request("https://mcp.carte.test/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "tools/call",
          params: { arguments: {}, name: "listMenuItems" },
        }),
        headers: {
          Authorization: "Bearer local-dev",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      env({ fetcher }),
    );

    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("forwards the X-Workspace-Id header to the downstream tool-call route", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: true }));
    const request = jsonRpcRequest(
      { method: "tools/call", params: { arguments: {}, name: "listMenuItems" } },
      { workspaceId: "ws-7" },
    );

    await handleMcpRequest(request, env({ fetcher }));

    expect(fetcher).toHaveBeenCalledTimes(1);
    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Workspace-Id"]).toBe("ws-7");
  });

  it("isolates state by forwarding distinct workspace ids to the plugin route", async () => {
    const calls: string[] = [];
    const fetcher = vi.fn(async (_url: unknown, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      calls.push(body.workspaceId);
      return Response.json({ ok: true });
    });

    await handleMcpRequest(
      jsonRpcRequest(
        { method: "tools/call", params: { arguments: {}, name: "listMenuItems" } },
        { workspaceId: "ws-restaurant-a" },
      ),
      env({ fetcher }),
    );
    await handleMcpRequest(
      jsonRpcRequest(
        { method: "tools/call", params: { arguments: {}, name: "listMenuItems" } },
        { workspaceId: "ws-restaurant-b" },
      ),
      env({ fetcher }),
    );

    expect(calls).toEqual(["ws-restaurant-a", "ws-restaurant-b"]);
  });

  it("rejects POST requests with no Authorization header as 401", async () => {
    const response = await handleMcpRequest(
      new Request("https://mcp.carte.test/mcp", {
        body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "tools/list" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      env(),
    );

    expect(response.status).toBe(401);
  });

  it("rejects POST requests with the wrong shared secret as 401", async () => {
    const response = await handleMcpRequest(
      new Request("https://mcp.carte.test/mcp", {
        body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "tools/list" }),
        headers: {
          Authorization: "Bearer wrong-secret",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      env(),
    );

    expect(response.status).toBe(401);
  });

  it("does not invoke fetch when authorization fails on tools/call", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: true }));
    const response = await handleMcpRequest(
      new Request("https://mcp.carte.test/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "tools/call",
          params: { arguments: { workspaceId: "ws-1" }, name: "listMenuItems" },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      env({ fetcher }),
    );

    expect(response.status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

function jsonRpcRequest(body: unknown, extras: { workspaceId?: string } = {}): Request {
  const headers: Record<string, string> = {
    Authorization: "Bearer local-dev",
    "Content-Type": "application/json",
  };
  if (extras.workspaceId !== undefined) {
    headers["X-Workspace-Id"] = extras.workspaceId;
  }
  return new Request("https://mcp.carte.test/mcp", {
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", ...body }),
    headers,
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
