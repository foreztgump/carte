export const DEFAULT_PLUGIN_ROUTE_BASE = "http://localhost:8787/_emdash/api/plugins/carte-ai";

const JSON_RPC_VERSION = "2.0";
const MCP_PROTOCOL_VERSION = "2025-06-18";
const TOOL_CALL_ROUTE = "tool-call";

export interface Env {
  EM_DASH_PLUGIN_BASE_URL?: string;
  MCP_SHARED_SECRET?: string;
  fetcher?: typeof fetch;
}

interface JsonRpcRequest {
  id?: number | string | null;
  method?: string;
  params?: unknown;
}

interface ToolCallParams {
  arguments?: unknown;
  name?: string | undefined;
}

interface JsonRpcErrorInput {
  code: number;
  id?: JsonRpcRequest["id"];
  message: string;
  status: number;
}

export default {
  fetch: handleMcpRequest,
} satisfies ExportedHandler<Env>;

export async function handleMcpRequest(request: Request, env: Env): Promise<Response> {
  try {
    if (request.method === "GET") {
      return json({ ok: true, service: "carte-ai-mcp-wrapper" });
    }
    if (request.method !== "POST") {
      return jsonRpcError({
        code: -32600,
        message: "Only POST JSON-RPC requests are supported.",
        status: 405,
      });
    }
    if (!isAuthorized(request, env)) {
      return new Response(null, { status: 401 });
    }
    return routeJsonRpc(await parseJsonRpc(request), env, request);
  } catch (error) {
    return jsonRpcError({ code: -32603, message: messageFrom(error), status: 500 });
  }
}

function isAuthorized(request: Request, env: Env): boolean {
  const expected = env.MCP_SHARED_SECRET;
  if (typeof expected !== "string" || expected.length === 0) {
    return false;
  }
  const presented = bearerToken(request.headers.get("Authorization"));
  if (presented === undefined) {
    return false;
  }
  return constantTimeEquals(presented, expected);
}

function bearerToken(header: string | null): string | undefined {
  if (header === null) {
    return undefined;
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

async function routeJsonRpc(
  message: JsonRpcRequest,
  env: Env,
  request: Request,
): Promise<Response> {
  if (message.method === "initialize") {
    return jsonRpcResult(message.id, initializeResult());
  }
  if (message.method === "tools/list") {
    return jsonRpcResult(message.id, { tools: toolDescriptors() });
  }
  if (message.method === "tools/call") {
    return proxyToolCall(message, env, request);
  }
  if (message.method === "notifications/initialized") {
    return new Response(null, { status: 202 });
  }
  return jsonRpcError({
    code: -32601,
    id: message.id,
    message: "Unsupported MCP method.",
    status: 404,
  });
}

async function proxyToolCall(
  message: JsonRpcRequest,
  env: Env,
  request: Request,
): Promise<Response> {
  const workspaceId = request.headers.get("X-Workspace-Id");
  if (workspaceId === null || workspaceId.trim() === "") {
    return new Response("X-Workspace-Id header is required.", { status: 400 });
  }
  const params = toolCallParams(message.params);
  const response = await fetcherFrom(env)(`${pluginBase(env)}/${TOOL_CALL_ROUTE}`, {
    body: JSON.stringify({
      arguments: params.arguments ?? {},
      toolName: requiredName(params),
      workspaceId,
    }),
    headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId },
    method: "POST",
  });
  return jsonRpcResult(message.id, { content: [{ text: await response.text(), type: "text" }] });
}

function initializeResult(): Record<string, unknown> {
  return {
    capabilities: { tools: {} },
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: { name: "carte-ai-mcp-wrapper", version: "0.1.0" },
  };
}

function toolDescriptors(): Array<Record<string, unknown>> {
  return [
    {
      name: "listMenuItems",
      description: "Read Carte menu items through the @carte/ai plugin route.",
      inputSchema: objectSchema({}),
    },
    {
      name: "updateMenuItemPrice",
      description: "Request a write-on-confirm menu price change with a diff preview.",
      inputSchema: objectSchema({ id: { type: "string" }, price: { type: "number" } }),
    },
  ];
}

async function parseJsonRpc(request: Request): Promise<JsonRpcRequest> {
  const parsed = await request.json();
  if (isRecord(parsed)) {
    return parsed as JsonRpcRequest;
  }
  throw new Error("JSON-RPC body must be an object.");
}

function toolCallParams(params: unknown): ToolCallParams {
  if (!isRecord(params)) {
    throw new Error("tools/call params must be an object.");
  }
  return { arguments: params.arguments, name: stringOrUndefined(params.name) };
}

function objectSchema(properties: Record<string, unknown>): Record<string, unknown> {
  return { type: "object", properties, additionalProperties: true };
}

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown): Response {
  return json({ id: id ?? null, jsonrpc: JSON_RPC_VERSION, result });
}

function jsonRpcError(input: JsonRpcErrorInput): Response {
  return json(
    { error: { code: input.code, message: input.message }, id: input.id ?? null, jsonrpc: "2.0" },
    input.status,
  );
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function requiredName(params: ToolCallParams): string {
  if (params.name !== undefined) {
    return params.name;
  }
  throw new Error("tools/call params require name.");
}

function pluginBase(env: Env): string {
  return env.EM_DASH_PLUGIN_BASE_URL ?? DEFAULT_PLUGIN_ROUTE_BASE;
}

function fetcherFrom(env: Env): typeof fetch {
  return env.fetcher ?? fetch;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Unhandled MCP wrapper error.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
