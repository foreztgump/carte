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
    log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
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
    expect(response.headers.get("content-disposition")).toContain("gdpr-export-");
    await expect(response.json()).resolves.toMatchObject({
      email: requestedEmail,
      reservations: [reservation],
      orders: [order],
    });
  });

  it("does not leak raw email PII into Content-Disposition and resists filename injection", async () => {
    const manifest = factory();
    // The email regex permits `"` and `;` in the local part. Use a value
    // that, if interpolated naively, would inject an extra header parameter.
    const maliciousLocal = `evil";x-inject="bad`;
    const malicious = `${maliciousLocal}@example.com`;
    const list: ContentList = async () => ({ items: [], hasMore: false });

    const response = (await manifest.routes["gdpr/export"]!.handler(
      routeContext(
        new Request(`https://carte.test/gdpr/export?email=${encodeURIComponent(malicious)}`, {
          headers: { "x-emdash-admin-scope": "true" },
        }),
        list,
      ),
    )) as Response;

    expect(response.status).toBe(200);
    const disposition = response.headers.get("content-disposition") ?? "";
    // No raw email PII in headers.
    expect(disposition.toLowerCase()).not.toContain(maliciousLocal.toLowerCase());
    expect(disposition.toLowerCase()).not.toContain("example.com");
    // No injected parameter.
    expect(disposition.toLowerCase()).not.toContain("x-inject");
    // Filename is the safe pattern: gdpr-export-<short-hash>-<timestamp>.json
    expect(disposition).toMatch(
      /filename="gdpr-export-[a-f0-9]{8,}-\d{4}-\d{2}-\d{2}T[\d:.\-Z]+\.json"/u,
    );
    // RFC 6266 filename* form is also present (UTF-8 percent-encoded).
    expect(disposition).toMatch(/filename\*=UTF-8''gdpr-export-[a-f0-9]{8,}-/u);
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
        create: async (_collection: string, data: Record<string, unknown>) =>
          contentItem("audit", data),
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

  it("emits one HR9 audit entry per erased record without storing raw PII", async () => {
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
    const audits: Array<{ collection: string; data: Record<string, unknown> }> = [];
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
        update: async (_collection: string, id: string, data: Record<string, unknown>) =>
          contentItem(id, data),
        create: async (collection: string, data: Record<string, unknown>) => {
          audits.push({ collection, data });
          return contentItem(`audit-${audits.length}`, data);
        },
      },
    } as unknown as RouteContext;

    const response = (await manifest.routes["gdpr/erase"]!.handler(context)) as Response;

    expect(response.status).toBe(200);
    expect(audits).toHaveLength(2);
    for (const audit of audits) {
      expect(audit.collection).toBe("carte_audit_log");
      expect(audit.data).toMatchObject({
        actor: expect.any(String),
        action: "gdpr.erasure",
        targetCollection: expect.stringMatching(/^carte_(reservations|orders)$/u),
        targetId: expect.any(String),
        beforeHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        afterHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/u),
      });
      const serialized = JSON.stringify(audit.data);
      expect(serialized).not.toContain("Ada Lovelace");
      expect(serialized).not.toContain("Guest@Example.com");
      expect(serialized).not.toContain("+15550101010");
      expect(serialized).not.toContain("Window table");
      expect(serialized).not.toContain("Leave at host stand");
    }
    const targets = audits.map((audit) => audit.data.targetCollection);
    expect(new Set(targets)).toEqual(new Set(["carte_reservations", "carte_orders"]));
  });

  it("does not erase PII when the audit write fails, and surfaces the failure", async () => {
    const manifest = factory();
    const guestEmail = "Guest@Example.com";
    const reservation = contentItem("reservation-1", {
      guest: { email: guestEmail, name: "Ada", phone: "+15550101010", notes: "n" },
      partySize: 2,
    });
    const order = contentItem("order-1", {
      customer: { email: guestEmail, name: "Ada", phone: "+15550101010", notes: "n" },
      total: 1000,
    });
    const updated: Array<{ collection: string; id: string }> = [];
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
          updated.push({ collection, id });
          return contentItem(id, data);
        },
        // Audit create fails for reservation-1 only
        create: async (_collection: string, data: Record<string, unknown>) => {
          if (data.targetId === "reservation-1") {
            throw new Error("audit-store unavailable");
          }
          return contentItem("audit", data);
        },
      },
    } as unknown as RouteContext;

    const response = (await manifest.routes["gdpr/erase"]!.handler(context)) as Response;

    // The reservation MUST NOT be erased (audit failed first).
    expect(updated.find((u) => u.id === "reservation-1")).toBeUndefined();
    // The order audit succeeded, so it should be erased.
    expect(updated.find((u) => u.id === "order-1")).toBeDefined();

    expect(response.status).toBe(207);
    const body = (await response.json()) as {
      erased: { reservations: number; orders: number };
      failed: Array<{ targetCollection: string; targetId: string; reason: string }>;
    };
    expect(body.erased).toEqual({ reservations: 0, orders: 1 });
    expect(body.failed).toEqual([
      expect.objectContaining({
        targetCollection: "carte_reservations",
        targetId: "reservation-1",
        reason: expect.any(String),
      }),
    ]);
  });
});
