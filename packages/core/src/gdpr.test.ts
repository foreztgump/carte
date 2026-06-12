import { describe, expect, it } from "vitest";

import type { ContentAccess } from "emdash";
import type { PluginContext, SandboxedRouteContext } from "emdash/plugin";

import { GdprRequestError, gdprEraseRoute, gdprExportRoute } from "./gdpr.js";

type ContentList = ContentAccess["list"];
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

const routeCtx = (url: string): SandboxedRouteContext => ({
  input: undefined,
  request: { url, method: "GET", headers: {} },
});

const pluginCtx = (content: Partial<ContentAccess> | undefined): PluginContext =>
  ({
    content,
    log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  }) as unknown as PluginContext;

describe("@carte/core GDPR export route", () => {
  it("rejects requests without a valid email so the host can map a 4xx", async () => {
    const list: ContentList = async () => ({ items: [], hasMore: false });
    await expect(
      gdprExportRoute(routeCtx("https://carte.test/gdpr/export"), pluginCtx({ list })),
    ).rejects.toBeInstanceOf(GdprRequestError);
  });

  it("exports reservations and orders matching the requested email", async () => {
    const guestEmail = "Guest@Example.com";
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

    const result = await gdprExportRoute(
      routeCtx("https://carte.test/gdpr/export?email=guest@example.com"),
      pluginCtx({ list }),
    );

    expect(result).toMatchObject({
      email: "guest@example.com",
      reservations: [reservation],
      orders: [order],
    });
    expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u);
  });
});

describe("@carte/core GDPR erasure route", () => {
  it("strips guest PII while preserving revenue records", async () => {
    const guestEmail = "Guest@Example.com";
    const reservation = contentItem("reservation-1", {
      guest: { email: guestEmail, name: "Ada Lovelace", phone: "+15550101010", notes: "Window" },
      currency: "USD",
      depositTotal: 1500,
    });
    const order = contentItem("order-1", {
      customer: { email: guestEmail, name: "Ada Lovelace", phone: "+15550101010", notes: "Host" },
      currency: "USD",
      total: 4200,
    });
    const updated: Array<{ collection: string; id: string; data: Record<string, unknown> }> = [];
    const list: ContentList = async (collection: string) => ({
      items: collection === "carte_reservations" ? [reservation] : [order],
      hasMore: false,
    });
    const content: Partial<ContentAccess> = {
      list,
      update: async (collection: string, id: string, data: Record<string, unknown>) => {
        updated.push({ collection, id, data });
        return contentItem(id, data);
      },
      create: async (_collection: string, data: Record<string, unknown>) =>
        contentItem("audit", data),
    };

    const result = await gdprEraseRoute(
      routeCtx("https://carte.test/gdpr/erase?email=guest@example.com"),
      pluginCtx(content),
    );

    expect(result).toMatchObject({
      email: "guest@example.com",
      erased: { reservations: 1, orders: 1 },
      failed: [],
    });
    expect(updated).toHaveLength(2);
    expect(updated[0]!.data).toMatchObject({
      guest: {
        email: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
        name: expect.stringMatching(/^erased:[a-f0-9]{64}$/u),
      },
      currency: "USD",
      depositTotal: 1500,
    });
  });

  it("emits one HR9 audit entry per erased record without storing raw PII", async () => {
    const guestEmail = "Guest@Example.com";
    const reservation = contentItem("reservation-1", {
      guest: { email: guestEmail, name: "Ada Lovelace", phone: "+15550101010", notes: "Window" },
    });
    const order = contentItem("order-1", {
      customer: { email: guestEmail, name: "Ada Lovelace", phone: "+15550101010", notes: "Host" },
    });
    const audits: Array<{ collection: string; data: Record<string, unknown> }> = [];
    const list: ContentList = async (collection: string) => ({
      items: collection === "carte_reservations" ? [reservation] : [order],
      hasMore: false,
    });
    const content: Partial<ContentAccess> = {
      list,
      update: async (_collection: string, id: string, data: Record<string, unknown>) =>
        contentItem(id, data),
      create: async (collection: string, data: Record<string, unknown>) => {
        audits.push({ collection, data });
        return contentItem(`audit-${audits.length}`, data);
      },
    };

    await gdprEraseRoute(
      routeCtx("https://carte.test/gdpr/erase?email=guest@example.com"),
      pluginCtx(content),
    );

    expect(audits).toHaveLength(2);
    for (const audit of audits) {
      expect(audit.collection).toBe("carte_audit_log");
      expect(audit.data).toMatchObject({
        action: "gdpr.erasure",
        targetCollection: expect.stringMatching(/^carte_(reservations|orders)$/u),
        beforeHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        afterHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      });
      const serialized = JSON.stringify(audit.data);
      expect(serialized).not.toContain("Ada Lovelace");
      expect(serialized).not.toContain("Guest@Example.com");
    }
  });

  it("does not erase PII when the audit write fails, and surfaces the failure", async () => {
    const guestEmail = "Guest@Example.com";
    const reservation = contentItem("reservation-1", {
      guest: { email: guestEmail, name: "Ada", phone: "+15550101010", notes: "n" },
    });
    const order = contentItem("order-1", {
      customer: { email: guestEmail, name: "Ada", phone: "+15550101010", notes: "n" },
    });
    const updated: Array<{ id: string }> = [];
    const list: ContentList = async (collection: string) => ({
      items: collection === "carte_reservations" ? [reservation] : [order],
      hasMore: false,
    });
    const content: Partial<ContentAccess> = {
      list,
      update: async (_collection: string, id: string, data: Record<string, unknown>) => {
        updated.push({ id });
        return contentItem(id, data);
      },
      create: async (_collection: string, data: Record<string, unknown>) => {
        if (data.targetId === "reservation-1") throw new Error("audit-store unavailable");
        return contentItem("audit", data);
      },
    };

    const result = await gdprEraseRoute(
      routeCtx("https://carte.test/gdpr/erase?email=guest@example.com"),
      pluginCtx(content),
    );

    expect(updated.find((u) => u.id === "reservation-1")).toBeUndefined();
    expect(updated.find((u) => u.id === "order-1")).toBeDefined();
    expect(result).toMatchObject({
      erased: { reservations: 0, orders: 1 },
      failed: [
        expect.objectContaining({
          targetCollection: "carte_reservations",
          targetId: "reservation-1",
        }),
      ],
    });
  });

  it("reports an erase failure when the PII update throws after the audit write", async () => {
    const guestEmail = "Guest@Example.com";
    const reservation = contentItem("reservation-1", {
      guest: { email: guestEmail, name: "Ada", phone: "+15550101010", notes: "n" },
    });
    const order = contentItem("order-1", {
      customer: { email: guestEmail, name: "Ada", phone: "+15550101010", notes: "n" },
    });
    const list: ContentList = async (collection: string) => ({
      items: collection === "carte_reservations" ? [reservation] : [order],
      hasMore: false,
    });
    const content: Partial<ContentAccess> = {
      list,
      update: async (collection: string, id: string, data: Record<string, unknown>) => {
        if (id === "reservation-1") throw new Error("content-store write rejected");
        return contentItem(id, data);
      },
      create: async (_collection: string, data: Record<string, unknown>) =>
        contentItem("audit", data),
    };

    const result = await gdprEraseRoute(
      routeCtx("https://carte.test/gdpr/erase?email=guest@example.com"),
      pluginCtx(content),
    );

    expect(result).toMatchObject({
      erased: { reservations: 0, orders: 1 },
      failed: [
        expect.objectContaining({
          targetCollection: "carte_reservations",
          targetId: "reservation-1",
          reason: "content-store write rejected",
        }),
      ],
    });
  });

  it("reports a per-collection failure when listing one collection throws", async () => {
    const order = contentItem("order-1", {
      customer: { email: "guest@example.com", name: "Ada", phone: "+15550101010", notes: "n" },
    });
    const list: ContentList = async (collection: string) => {
      if (collection === "carte_reservations") throw new Error("list unavailable");
      return { items: [order], hasMore: false };
    };
    const content: Partial<ContentAccess> = {
      list,
      update: async (_collection: string, id: string, data: Record<string, unknown>) =>
        contentItem(id, data),
      create: async (_collection: string, data: Record<string, unknown>) =>
        contentItem("audit", data),
    };

    const result = await gdprEraseRoute(
      routeCtx("https://carte.test/gdpr/erase?email=guest@example.com"),
      pluginCtx(content),
    );

    expect(result).toMatchObject({
      erased: { reservations: 0, orders: 1 },
      failed: [
        expect.objectContaining({
          targetCollection: "carte_reservations",
          reason: "list unavailable",
        }),
      ],
    });
  });
});
