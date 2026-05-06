import type { ContentAccess, KVAccess, RouteContext } from "emdash";

import { DIETARY_TAG_TO_SCHEMA_URI } from "./taxonomy/allergens.js";

const JSONLD_CONTEXT = "https://schema.org";
const JSONLD_CACHE_KEY = "schema-jsonld";
const JSONLD_CACHE_TTL_SECONDS = 1_800;
const RESTAURANT_COLLECTION = "carte_restaurants";
const MENU_COLLECTION = "carte_menus";
const SECTION_COLLECTION = "carte_menu_sections";
const ITEM_COLLECTION = "carte_menu_items";
const LIST_LIMIT = 100;
const DEFAULT_CURRENCY = "USD";
const WEEKDAY_URIS: Record<string, string> = {
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
};
type JsonLdKv = KVAccess & {
  put?: (key: string, value: string, options: { expirationTtl: number }) => Promise<void>;
};
type JsonLdNode = Record<string, unknown>;
type ContentListResult = Awaited<ReturnType<ContentAccess["list"]>>;
type ListedContentItem = ContentListResult["items"][number];
type Collections = {
  restaurant: ListedContentItem;
  menus: ListedContentItem[];
  sections: ListedContentItem[];
  items: ListedContentItem[];
};

export const createSchemaJsonLd = async (ctx: RouteContext): Promise<JsonLdNode> => {
  const cached = await readCachedJsonLd(ctx.kv);
  if (cached) return cached;

  const jsonLd = buildRestaurantJsonLd(await readCollections(ctx.content));
  await writeCachedJsonLd(ctx.kv, jsonLd);
  return jsonLd;
};

const readCachedJsonLd = async (kv: JsonLdKv): Promise<JsonLdNode | null> => {
  const value = await kv.get<string | JsonLdNode>(JSONLD_CACHE_KEY);
  if (!value) return null;
  return typeof value === "string" ? (JSON.parse(value) as JsonLdNode) : value;
};

const writeCachedJsonLd = async (kv: JsonLdKv, jsonLd: JsonLdNode): Promise<void> => {
  const serialized = JSON.stringify(jsonLd);
  if (kv.put) {
    await kv.put(JSONLD_CACHE_KEY, serialized, { expirationTtl: JSONLD_CACHE_TTL_SECONDS });
    return;
  }
  await kv.set(JSONLD_CACHE_KEY, serialized);
};

const readCollections = async (content: ContentAccess | undefined): Promise<Collections> => {
  if (!content) throw new Error("ctx.content is required to build schema.org JSON-LD.");
  const [restaurants, menus, sections, items] = await Promise.all([
    listContent(content, RESTAURANT_COLLECTION),
    listContent(content, MENU_COLLECTION),
    listContent(content, SECTION_COLLECTION),
    listContent(content, ITEM_COLLECTION),
  ]);

  const restaurant = restaurants[0];
  if (!restaurant) throw new Error("carte_restaurants must include a restaurant profile.");
  return { restaurant, menus, sections, items };
};

const listContent = async (
  content: ContentAccess,
  collection: string,
): Promise<ListedContentItem[]> => {
  const result = await content.list(collection, { limit: LIST_LIMIT });
  return result.items;
};

const buildRestaurantJsonLd = ({ restaurant, menus, sections, items }: Collections): JsonLdNode => {
  const data = restaurant.data;
  const menu = buildMenu(menus, sections, items);
  return compactObject({
    "@context": JSONLD_CONTEXT,
    "@type": "Restaurant",
    "@id": asString(data.website) ? `${asString(data.website)}#restaurant` : undefined,
    name: asString(data.name),
    description: asText(data.description) ?? asString(data.tagline),
    url: asString(data.website),
    telephone: asString(data.phone),
    address: buildAddress(data.address),
    openingHoursSpecification: buildOpeningHours(data.hours),
    acceptsReservations: asBoolean(data.acceptsReservations),
    priceRange: asString(data.priceRange),
    servesCuisine: asStringArray(data.cuisineTypes),
    hasMenu: menu,
  });
};

const buildMenu = (
  menus: ListedContentItem[],
  sections: ListedContentItem[],
  items: ListedContentItem[],
): JsonLdNode =>
  compactObject({
    "@type": "Menu",
    name: asString(firstActiveMenu(menus)?.data.name) ?? "Menu",
    description: asString(firstActiveMenu(menus)?.data.description),
    hasMenuSection: sections
      .sort(sortByPosition)
      .map((section) => buildMenuSection(section, items))
      .filter((section) => (section.hasMenuItem as unknown[] | undefined)?.length),
  });

const buildMenuSection = (section: ListedContentItem, items: ListedContentItem[]): JsonLdNode =>
  compactObject({
    "@type": "MenuSection",
    name: asString(section.data.name),
    description: asString(section.data.description),
    hasMenuItem: items
      .filter((item) => item.data.section === section.id && item.data.available !== false)
      .sort(sortByPosition)
      .map(buildMenuItem),
  });

const buildMenuItem = (item: ListedContentItem): JsonLdNode =>
  compactObject({
    "@type": "MenuItem",
    name: asString(item.data.name),
    description: asText(item.data.description) ?? asString(item.data.shortDescription),
    offers: buildOffer(item.data.price),
    suitableForDiet: asDietUris(item.data.dietary),
  });

const buildAddress = (value: unknown): JsonLdNode | undefined => {
  if (!isRecord(value)) return undefined;
  return compactObject({
    "@type": "PostalAddress",
    streetAddress: [asString(value.line1), asString(value.line2)].filter(Boolean).join(", "),
    addressLocality: asString(value.city),
    addressRegion: asString(value.region),
    postalCode: asString(value.postalCode),
    addressCountry: asString(value.country),
  });
};

const buildOpeningHours = (value: unknown): JsonLdNode[] | undefined => {
  if (!isRecord(value)) return undefined;
  const specs = Object.entries(WEEKDAY_URIS).flatMap(([day, uri]) => daySpecs(uri, value[day]));
  return specs.length ? specs : undefined;
};

const daySpecs = (dayOfWeek: string, value: unknown): JsonLdNode[] => {
  const windows = Array.isArray(value) ? value : [value];
  return windows
    .map((window) => buildOpeningSpec(dayOfWeek, window))
    .filter((spec): spec is JsonLdNode => Boolean(spec));
};

const buildOpeningSpec = (dayOfWeek: string, value: unknown): JsonLdNode | undefined => {
  const range = parseTimeRange(value);
  if (!range) return undefined;
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek,
    opens: range.opens,
    closes: range.closes,
  };
};

const parseTimeRange = (value: unknown): { opens: string; closes: string } | null => {
  if (typeof value === "string") return parseTimeRangeString(value);
  if (!isRecord(value)) return null;
  const opens = asString(value.opens) ?? asString(value.start);
  const closes = asString(value.closes) ?? asString(value.end);
  return opens && closes ? { opens, closes } : null;
};

const parseTimeRangeString = (value: string): { opens: string; closes: string } | null => {
  const [opens, closes] = value.split("-");
  return opens && closes ? { opens, closes } : null;
};

const buildOffer = (value: unknown): JsonLdNode | undefined => {
  if (typeof value === "number") return offer(value, DEFAULT_CURRENCY);
  if (!isRecord(value)) return undefined;
  const amount = asNumber(value.amount) ?? asNumber(value.price);
  if (amount === undefined) return undefined;
  return offer(amount, asString(value.currency) ?? DEFAULT_CURRENCY);
};

const offer = (amount: number, currency: string): JsonLdNode => ({
  "@type": "Offer",
  price: amount.toFixed(2),
  priceCurrency: currency,
});

const asDietUris = (value: unknown): string[] | undefined => {
  const uris = asStringArray(value)
    ?.map((tag) => dietUriForTag(tag))
    .filter((uri): uri is string => Boolean(uri));
  return uris?.length ? uris : undefined;
};

const dietUriForTag = (tag: string): string | undefined => {
  const key = toCamelKey(tag);
  if (!isDietaryTag(key)) return undefined;
  return DIETARY_TAG_TO_SCHEMA_URI[key];
};

const isDietaryTag = (key: string): key is keyof typeof DIETARY_TAG_TO_SCHEMA_URI =>
  key in DIETARY_TAG_TO_SCHEMA_URI;

const firstActiveMenu = (menus: ListedContentItem[]): ListedContentItem | undefined =>
  menus.filter((menu) => menu.data.active !== false).sort(sortByPosition)[0];

const sortByPosition = (a: ListedContentItem, b: ListedContentItem): number =>
  (asNumber(a.data.position) ?? 0) - (asNumber(b.data.position) ?? 0);

const compactObject = (value: JsonLdNode): JsonLdNode =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const asText = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  return value.map(String).join(" ").trim() || undefined;
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;
const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;
const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const toCamelKey = (value: string): string =>
  value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
