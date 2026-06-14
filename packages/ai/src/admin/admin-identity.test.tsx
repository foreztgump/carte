import "@testing-library/jest-dom/vitest";

import { createElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pages } from "./index.js";
import { identityFromElementDataset } from "./admin-identity.js";

const CHAT_PATH = "/carte-ai";
const AUTH_ME_ROUTE = "/_emdash/api/auth/me";
const HISTORY_ROUTE = "/_emdash/api/plugins/carte-ai/history";

describe("CarteAiPage admin identity", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(fetchAdminIdentity));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads chat history with the current EmDash user and deployment origin", async () => {
    render(createElement(pages[CHAT_PATH]!));

    await waitFor(() => expect(historyRequest()).toBeDefined());

    const request = historyRequest();
    expect(request?.headers).toEqual(
      expect.objectContaining({
        "X-EmDash-Request": "1",
        "X-Workspace-Id": globalThis.location.origin,
      }),
    );
    expect(JSON.parse(String(request?.body))).toEqual({ userId: "admin-user-123" });
  });

  it("fails closed when the current admin identity is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { code: "NOT_AUTHENTICATED" } }), {
            status: 401,
          }),
      ),
    );

    render(createElement(pages[CHAT_PATH]!));

    expect(await screen.findByText(/admin identity is unavailable/i)).toBeInTheDocument();
    expect(historyRequest()).toBeUndefined();
  });

  it("fails closed when the identity request cannot complete", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network unavailable");
      }),
    );

    render(createElement(pages[CHAT_PATH]!));

    expect(await screen.findByText(/admin identity is unavailable/i)).toBeInTheDocument();
    expect(historyRequest()).toBeUndefined();
  });

  it("preserves host-provided root dataset identity for direct mounts", () => {
    const element = document.createElement("div");
    element.dataset.userId = "host-user";
    element.dataset.workspaceId = "host-workspace";

    expect(identityFromElementDataset(element)).toEqual({
      userId: "host-user",
      workspaceId: "host-workspace",
    });
  });
});

async function fetchAdminIdentity(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  if (url === AUTH_ME_ROUTE) {
    return Response.json({ data: { id: "admin-user-123" } });
  }
  if (url === HISTORY_ROUTE && init?.method === "POST") {
    return Response.json({ messages: [] });
  }
  return new Response("Unexpected request", { status: 500 });
}

function historyRequest(): RequestInit | undefined {
  const fetchMock = vi.mocked(fetch);
  const call = fetchMock.mock.calls.find(([url]) => String(url) === HISTORY_ROUTE);
  return call?.[1];
}
