import { describe, expect, it, vi } from "vitest";

import { routes } from "../routes.js";

import type { ContentItem, RouteContext } from "emdash";

const MENU_COLLECTION = "carte_menu_items";

const item = (data: Record<string, unknown>): ContentItem =>
  ({
    id: "item-1",
    type: MENU_COLLECTION,
    slug: "daily-soup",
    status: "published",
    locale: "en",
    data,
    createdAt: "2026-05-06T00:00:00.000Z",
    updatedAt: "2026-05-06T00:00:00.000Z",
    publishedAt: "2026-05-06T00:00:00.000Z",
  }) as unknown as ContentItem;

const makeContext = (
  items: ContentItem[],
  input: Record<string, unknown> = {},
): RouteContext & { content: { update: ReturnType<typeof vi.fn> } } => {
  const update = vi.fn(async (_collection: string, _id: string, data: Record<string, unknown>) =>
    item(data),
  );

  return {
    content: {
      get: vi.fn(),
      list: vi.fn(async () => ({ items, hasMore: false })),
      update,
    },
    input,
    request: new Request("https://example.test/_emdash/api/plugins/carte-core/menu-feed"),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
  } as unknown as RouteContext & { content: { update: ReturnType<typeof vi.fn> } };
};

describe("@carte/core menu item availability", () => {
  it("86 button marks an item unavailable until the next 6am local time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 6, 23, 0, 0));
    const ctx = makeContext([], { itemId: "item-1" });

    await routes["menu-items/86"].handler(ctx);

    expect(ctx.content.update).toHaveBeenCalledWith(MENU_COLLECTION, "item-1", {
      available: false,
      unavailableUntil: new Date(2026, 4, 7, 6, 0, 0).toISOString(),
    });
    vi.useRealTimers();
  });

  it("keeps 86'd items unavailable before unavailableUntil passes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 7, 5, 59, 0));
    const unavailableUntil = new Date(2026, 4, 7, 6, 0, 0).toISOString();
    const ctx = makeContext([item({ name: "Soup", available: false, unavailableUntil })]);

    const result = (await routes["menu-feed"].handler(ctx)) as { items: ContentItem[] };

    expect(result.items[0]?.data.available).toBe(false);
    expect(ctx.content.update).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("restores 86'd items after unavailableUntil passes on menu read", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 7, 6, 1, 0));
    const unavailableUntil = new Date(2026, 4, 7, 6, 0, 0).toISOString();
    const ctx = makeContext([item({ name: "Soup", available: false, unavailableUntil })]);

    const result = (await routes["menu-feed"].handler(ctx)) as { items: ContentItem[] };

    expect(result.items[0]?.data.available).toBe(true);
    expect(ctx.content.update).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("deduplicates concurrent lazy restores for the same item", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 7, 6, 1, 0));
    const staleItem = item({
      name: "Soup",
      available: false,
      unavailableUntil: new Date(2026, 4, 7, 6, 0, 0).toISOString(),
    });
    const ctx = makeContext([staleItem]);

    await Promise.all([routes["menu-feed"].handler(ctx), routes["menu-feed"].handler(ctx)]);

    expect(ctx.content.update).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
