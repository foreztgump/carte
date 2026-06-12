import { describe, expect, it, vi } from "vitest";

import { routes } from "../routes.js";

import type { RouteContext } from "emdash";

const ADMIN_ROUTES = ["admin", "admin/restaurant", "admin/hours", "admin/settings"] as const;
const FORBIDDEN_SECTION_MARKERS = ["**", "[", "]"] as const;
const CORE_BLOCK_TYPES = new Set(["section", "divider", "stats", "actions"]);

type ContentListResult = { items: Array<Record<string, unknown>>; hasMore: boolean };

const pageItems = (collection: string): ContentListResult => ({
  items: [
    {
      id: `${collection}-1`,
      type: collection,
      slug: collection,
      status: "published",
      locale: "en",
      data: { title: `${collection} fixture`, name: `${collection} fixture` },
      createdAt: "2026-05-06T00:00:00.000Z",
      updatedAt: "2026-05-06T00:00:00.000Z",
      publishedAt: "2026-05-06T00:00:00.000Z",
    },
  ],
  hasMore: false,
});

const makeContext = (): RouteContext => {
  const list = vi.fn(async (collection: string) => pageItems(collection));

  return {
    content: { list, get: vi.fn() },
    input: {},
    request: new Request("https://example.test/_emdash/api/plugins/carte-core/admin"),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
  } as unknown as RouteContext;
};

const routeHandler = (route: (typeof ADMIN_ROUTES)[number]) => {
  const pluginRoute = routes[route];
  return pluginRoute.handler;
};

const walk = (value: unknown, visit: (key: string, value: unknown) => void, key = ""): void => {
  visit(key, value);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([childKey, childValue]) => walk(childValue, visit, childKey));
  }
};

const pageBlocks = async (route: (typeof ADMIN_ROUTES)[number]) => {
  const page = await routeHandler(route)(makeContext());
  const blocks = (page as { blocks?: unknown }).blocks;

  expect(blocks).toEqual(expect.any(Array));

  return blocks as Array<Record<string, unknown>>;
};

describe("@carte/core Block Kit admin pages", () => {
  it.each(ADMIN_ROUTES)("%s renders stable canonical Block Kit JSON", async (route) => {
    const page = await routeHandler(route)(makeContext());

    expect(page).toMatchSnapshot();
  });

  it.each(ADMIN_ROUTES)(
    "%s uses canonical primitives without redirects or markdown",
    async (route) => {
      const page = await routeHandler(route)(makeContext());

      walk(page, (key, value) => {
        expect(key).not.toBe("stats");
        expect(value).not.toEqual({ type: "redirect" });
        if (key === "text" && typeof value === "string") {
          FORBIDDEN_SECTION_MARKERS.forEach((marker) => expect(value).not.toContain(marker));
        }
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const block = value as Record<string, unknown>;
          if (block.type === "button") expect(block).not.toHaveProperty("text");
        }
      });
      expect(JSON.stringify(page)).not.toContain('"type":"redirect"');
    },
  );

  it.each(ADMIN_ROUTES)("%s emits 0.18 Block Kit block shapes", async (route) => {
    const blocks = await pageBlocks(route);

    blocks.forEach((block) => {
      expect(CORE_BLOCK_TYPES.has(String(block.type))).toBe(true);
      expect(block).not.toHaveProperty("id");
      if (block.type === "section") expect(block).not.toHaveProperty("title");
      if (block.type === "actions") {
        expect(block).not.toHaveProperty("items");
        expect(block.elements).toEqual(expect.any(Array));
      }
      if (block.type === "stats") expect(block.items).toEqual(expect.any(Array));
    });
  });

  it.each(ADMIN_ROUTES)("%s emits valid 0.18 action button elements", async (route) => {
    const blocks = await pageBlocks(route);
    const actionBlocks = blocks.filter((block) => block.type === "actions");

    expect(actionBlocks.length).toBeGreaterThan(0);
    actionBlocks
      .flatMap((block) => block.elements as Array<Record<string, unknown>>)
      .forEach((element) => {
        expect(element).toMatchObject({ type: "button" });
        expect(element.action_id).toEqual(expect.any(String));
        expect(element.label).toEqual(expect.any(String));
        expect(element).not.toHaveProperty("id");
        expect(element).not.toHaveProperty("action");
        expect(element).not.toHaveProperty("text");
      });
  });

  it("settings surfaces the Cloudflare Free degradation warning", async () => {
    const page = await routeHandler("admin/settings")(makeContext());

    expect(JSON.stringify(page)).toContain("Cloudflare Free");
    expect(JSON.stringify(page)).toContain("sandboxed plugins run unsandboxed");
    expect(JSON.stringify(page)).toContain("EmDash Issue #149");
  });
});
