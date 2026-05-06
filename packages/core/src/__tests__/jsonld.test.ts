import { describe, expect, it, vi } from "vitest";

import { routes } from "../routes.js";

import type { ContentItem, RouteContext } from "emdash";

const RESTAURANT_COLLECTION = "carte_restaurants";
const MENU_COLLECTION = "carte_menus";
const SECTION_COLLECTION = "carte_menu_sections";
const ITEM_COLLECTION = "carte_menu_items";
const JSONLD_CACHE_KEY = "schema-jsonld";
const JSONLD_CACHE_TTL_SECONDS = 1_800;

const contentItem = (collection: string, id: string, data: Record<string, unknown>): ContentItem =>
  ({
    id,
    type: collection,
    slug: id,
    status: "published",
    locale: "en",
    data,
    createdAt: "2026-05-06T00:00:00.000Z",
    updatedAt: "2026-05-06T00:00:00.000Z",
    publishedAt: "2026-05-06T00:00:00.000Z",
  }) as unknown as ContentItem;

const fixtures = {
  [RESTAURANT_COLLECTION]: [
    contentItem(RESTAURANT_COLLECTION, "main", {
      name: "Carte Bistro",
      address: {
        line1: "1 Main Street",
        city: "Portland",
        region: "OR",
        postalCode: "97201",
        country: "US",
      },
      phone: "+15035550100",
      website: "https://carte.example",
      cuisineTypes: ["French", "Pacific Northwest"],
      priceRange: "$$",
      acceptsReservations: true,
      hours: {
        monday: [{ opens: "09:00", closes: "17:00" }],
        tuesday: [{ start: "10:00", end: "16:00" }],
      },
    }),
  ],
  [MENU_COLLECTION]: [
    contentItem(MENU_COLLECTION, "dinner", {
      name: "Dinner",
      description: "Evening menu",
      active: true,
      position: 1,
    }),
  ],
  [SECTION_COLLECTION]: [
    contentItem(SECTION_COLLECTION, "mains", {
      name: "Mains",
      description: "Entrees",
      position: 1,
    }),
  ],
  [ITEM_COLLECTION]: [
    contentItem(ITEM_COLLECTION, "risotto", {
      name: "Mushroom Risotto",
      description: "Arborio rice with mushrooms",
      price: { amount: 18.5, currency: "USD" },
      section: "mains",
      menus: ["dinner"],
      dietary: ["vegetarian", "gluten-free"],
      available: true,
      position: 1,
    }),
  ],
};

const makeContext = (cacheValue: unknown = null) => {
  const kv = {
    get: vi.fn(async () => cacheValue),
    set: vi.fn(),
    put: vi.fn(async () => undefined),
    delete: vi.fn(),
    list: vi.fn(),
  };
  const content = {
    get: vi.fn(),
    list: vi.fn(async (collection: string) => ({
      items: fixtures[collection as keyof typeof fixtures] ?? [],
      hasMore: false,
    })),
  };

  return {
    kv,
    content,
    input: {},
    request: new Request("https://example.test/_emdash/api/plugins/carte-core/schema-jsonld"),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
  } as unknown as RouteContext & { kv: typeof kv; content: typeof content };
};

describe("@carte/core schema.org JSON-LD", () => {
  it("returns Restaurant JSON-LD with nested Menu, sections, items, offers, and diets", async () => {
    const ctx = makeContext();

    const result = await routes["schema-jsonld"].handler(ctx);

    expect(result).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Carte Bistro",
      address: { "@type": "PostalAddress", streetAddress: "1 Main Street" },
      acceptsReservations: true,
      priceRange: "$$",
      servesCuisine: ["French", "Pacific Northwest"],
      hasMenu: {
        "@type": "Menu",
        hasMenuSection: [
          {
            "@type": "MenuSection",
            name: "Mains",
            hasMenuItem: [
              {
                "@type": "MenuItem",
                name: "Mushroom Risotto",
                offers: { "@type": "Offer", price: "18.50", priceCurrency: "USD" },
                suitableForDiet: [
                  "https://schema.org/VegetarianDiet",
                  "https://schema.org/GlutenFreeDiet",
                ],
              },
            ],
          },
        ],
      },
    });
    expect(result).toMatchSnapshot();
  });

  it("caches generated JSON-LD in plugin KV for 30 minutes", async () => {
    const ctx = makeContext();

    await routes["schema-jsonld"].handler(ctx);

    expect(ctx.kv.put).toHaveBeenCalledWith(JSONLD_CACHE_KEY, expect.any(String), {
      expirationTtl: JSONLD_CACHE_TTL_SECONDS,
    });
  });

  it("serves a cached JSON-LD payload without reading content", async () => {
    const cached = { "@context": "https://schema.org", "@type": "Restaurant", name: "Cached" };
    const ctx = makeContext(JSON.stringify(cached));

    await expect(routes["schema-jsonld"].handler(ctx)).resolves.toEqual(cached);

    expect(ctx.content.list).not.toHaveBeenCalled();
    expect(ctx.kv.put).not.toHaveBeenCalled();
  });
});
