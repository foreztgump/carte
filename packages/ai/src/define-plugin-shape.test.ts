import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import factory from "./index.js";
import adminExports, { pages } from "./admin/index.js";

afterEach(cleanup);

const CHAT_PATH = "/carte-ai";
const SECRET_KEYS = ["anthropicApiKey", "openaiApiKey", "geminiApiKey"] as const;

describe("@carte/ai native definePlugin shape (0.18)", () => {
  it("does not carry the dead pre-v0.13 relative admin entry", () => {
    const plugin = factory();
    const entry = plugin.admin?.entry ?? "";
    // The dead shape was a relative module path ending in a JS file; the 0.18
    // shape is a bare package module specifier. Guard regression without
    // embedding the dead literal.
    expect(entry.startsWith("@carte/")).toBe(true);
    expect(/\.js$/.test(entry)).toBe(false);
    expect(entry.includes("/")).toBe(true);
    expect(entry.startsWith(".")).toBe(false);
  });

  it("mounts React admin via the documented package module specifier", () => {
    const plugin = factory();
    expect(plugin.admin?.entry).toBe("@carte/ai/admin");
  });

  it("preserves the declared admin page", () => {
    const plugin = factory();
    expect(plugin.admin?.pages).toEqual([{ path: CHAT_PATH, label: "Chat", icon: "sparkles" }]);
  });

  it("keeps the BYO-LLM settings schema with all three secret keys", () => {
    const plugin = factory();
    const schema = plugin.admin?.settingsSchema ?? {};
    for (const key of SECRET_KEYS) {
      expect(schema[key]?.type).toBe("secret");
    }
  });

  it("exposes `pages` as a NAMED export keyed by the chat page path", () => {
    expect(Object.keys(pages)).toEqual([CHAT_PATH]);
    expect(adminExports.pages).toBe(pages);
  });

  it("stores the chat page value as a renderable component function, not an element", () => {
    for (const page of Object.values(pages)) {
      expect(typeof page).toBe("function");
    }
  });

  describe("chat page render", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(JSON.stringify({ messages: [] }))),
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("renders the chat panel UI from the named pages component", () => {
      render(createElement(pages[CHAT_PATH]!));
      expect(screen.getByRole("heading", { name: "Carte AI" })).toBeTruthy();
    });
  });
});
