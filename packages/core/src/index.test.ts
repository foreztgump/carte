import { describe, expect, it } from "vitest";

import factory from "./index.js";

import type { RouteContext } from "emdash";

const CANONICAL_CAPABILITIES = new Set([
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "network:request",
  "email:send",
  "users:read",
]);

describe("@carte/core manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-core");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names only", () => {
    const manifest = factory();
    for (const cap of manifest.capabilities) {
      expect(CANONICAL_CAPABILITIES.has(cap)).toBe(true);
    }
    expect(manifest.capabilities).toContain("content:read");
    expect(manifest.capabilities).toContain("content:write");
    expect(manifest.capabilities).toContain("media:read");
  });
});

type ContentList = NonNullable<RouteContext["content"]>["list"];
type TestContentItem = Awaited<ReturnType<ContentList>>["items"][number];

const contentItem = (id: string, data: Record<string, unknown>): TestContentItem => ({
  id,
  type: "entry",
  slug: null,
  status: "published",
  data,
  createdAt: "2026-05-08T00:00:00.000Z",
  updatedAt: "2026-05-08T00:00:00.000Z",
  publishedAt: "2026-05-08T00:00:00.000Z",
  locale: null,
});

const routeContext = (request: Request, list: ContentList): RouteContext =>
  ({
    request,
    input: undefined,
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
    content: { list },
  }) as unknown as RouteContext;

describe("@carte/core GDPR export route", () => {
  it("rejects callers without admin scope", async () => {
    const manifest = factory();
    const list: ContentList = async () => ({ items: [], hasMore: false });

    const response = (await manifest.routes["gdpr/export"]!.handler(
      routeContext(new Request("https://carte.test/gdpr/export?email=guest@example.com"), list),
    )) as Response;

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Admin scope required" });
  });

  it("exports reservations and orders matching the requested email", async () => {
    const manifest = factory();
    const guestEmail = "Guest@Example.com";
    const requestedEmail = "guest@example.com";
    const reservation = contentItem("reservation-1", {
      guest: { email: guestEmail, name: "Ada", phone: "+15550101010" },
      partySize: 4,
    });
    const order = contentItem("order-1", {
      customer: { email: guestEmail, name: "Ada", phone: "+15550101010" },
      total: 4200,
    });
    const otherOrder = contentItem("order-2", {
      customer: { email: "other@example.com", name: "Grace" },
      total: 1200,
    });
    const list: ContentList = async (collection: string) => ({
      items: collection === "carte_reservations" ? [reservation] : [order, otherOrder],
      hasMore: false,
    });

    const response = (await manifest.routes["gdpr/export"]!.handler(
      routeContext(
        new Request(`https://carte.test/gdpr/export?email=${requestedEmail}`, {
          headers: { "x-emdash-admin-scope": "true" },
        }),
        list,
      ),
    )) as Response;

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("content-disposition")).toContain("carte-gdpr-export");
    await expect(response.json()).resolves.toMatchObject({
      email: requestedEmail,
      reservations: [reservation],
      orders: [order],
    });
  });
});

describe("@carte/core GDPR erasure route", () => {
  it("strips guest PII while preserving revenue records", async () => {
    const manifest = factory();
    const guestEmail = "Guest@Example.com";
    const reservation = contentItem("reservation-1", {
      guest: {
        email: guestEmail,
        name: "Ada Lovelace",
        phone: "+15550101010",
        notes: "Window table",
      },
      currency: "USD",
      depositTotal: 1500,
      partySize: 4,
    });
    const order = contentItem("order-1", {
      customer: {
        email: guestEmail,
        name: "Ada Lovelace",
        phone: "+15550101010",
        notes: "Leave at host stand",
      },
      currency: "USD",
      lineItems: [{ itemName: "Tasting Menu", unitPrice: 4200 }],
      total: 4200,
    });
    const updated: Array<{ collection: string; id: string; data: Record<string, unknown> }> = [];
    const list: ContentList = async (collection: string) => ({
      items: collection === "carte_reservations" ? [reservation] : [order],
      hasMore: false,
    });
    const context = {
      ...routeContext(
        new Request("https://carte.test/gdpr/erase?email=guest@example.com", {
          method: "POST",
          headers: { "x-emdash-admin-scope": "true" },
        }),
        list,
      ),
      content: {
        list,
        update: async (collection: string, id: string, data: Record<string, unknown>) => {
          updated.push({ collection, id, data });
          return contentItem(id, data);
        },
      },
    } as unknown as RouteContext;

    const response = (await manifest.routes["gdpr/erase"]!.handler(context)) as Response;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      email: "guest@example.com",
      erased: { reservations: 1, orders: 1 },
    });
    expect(updated).toHaveLength(2);
    const erasedReservation = updated[0]!.data;
    const erasedOrder = updated[1]!.data;
    expect(erasedReservation).toMatchObject({
      guest: {
        email: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
        name: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
        phone: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
        notes: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
      },
      currency: "USD",
      depositTotal: 1500,
      partySize: 4,
    });
    expect(erasedOrder).toMatchObject({
      customer: {
        email: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
        name: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
        phone: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
        notes: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
      },
      currency: "USD",
      lineItems: [{ itemName: "Tasting Menu", unitPrice: 4200 }],
      total: 4200,
    });
    expect((erasedReservation.guest as Record<string, unknown>).email).toBe(
      (erasedOrder.customer as Record<string, unknown>).email,
    );
  });
});
