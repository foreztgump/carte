import { describe, expect, it, vi } from "vitest";

import factory from "../index.js";

import type { PluginContext } from "emdash";

const EMPTY_CONTEXT = {} as PluginContext;

const menuItemEvent = (content: Record<string, unknown>) => ({
  collection: "carte_menu_items",
  content,
  isNew: false,
});

const getHookHandler = (hookName: "content:beforeSave" | "content:afterSave") => {
  const manifest = factory();
  const hook = manifest.hooks[hookName];

  if (!hook) {
    throw new Error(`Missing ${hookName} hook`);
  }

  return hook.handler;
};

describe("@carte/core content:beforeSave", () => {
  it("rejects negative menu item prices", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(handler(menuItemEvent({ price: -1 }), EMPTY_CONTEXT)).rejects.toThrow(
      "price must be a non-negative number",
    );
  });

  it("rejects non-canonical allergen tags", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ allergens: ["made-up-allergen"] }), EMPTY_CONTEXT),
    ).rejects.toThrow("Unknown allergen tag");
  });

  it("normalizes canonical allergen tags", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: 12.5, allergens: [" Tree Nuts ", "MILK"] }), EMPTY_CONTEXT),
    ).resolves.toMatchObject({
      allergens: ["tree-nuts", "milk"],
    });
  });

  it("rejects structured price with negative amount", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: { amount: -1, currency: "USD" } }), EMPTY_CONTEXT),
    ).rejects.toThrow("price must be a non-negative number");
  });

  it("rejects structured price with NaN amount", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: { amount: Number.NaN, currency: "USD" } }), EMPTY_CONTEXT),
    ).rejects.toThrow("price must be a non-negative number");
  });

  it("rejects structured price missing amount", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: { currency: "USD" } }), EMPTY_CONTEXT),
    ).rejects.toThrow("price must be a non-negative number");
  });

  it("accepts structured price with non-negative amount", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: { amount: 12.5, currency: "USD" } }), EMPTY_CONTEXT),
    ).resolves.toMatchObject({
      price: { amount: 12.5, currency: "USD" },
    });
  });

  it("rejects malformed hours strings", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: 12.5, hours: ["9am until late"] }), EMPTY_CONTEXT),
    ).rejects.toThrow("hours must use HH:mm-HH:mm format");
  });
});

describe("@carte/core content:afterSave", () => {
  it("schedules cache invalidation inside waitUntil for carte collections", async () => {
    const handler = getHookHandler("content:afterSave");
    const scheduled: Promise<unknown>[] = [];
    const waitUntil = vi.fn((promise: Promise<unknown>) => scheduled.push(promise));
    const kv = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(async () => true),
      list: vi.fn(),
    };
    const ctx = { kv, waitUntil } as unknown as PluginContext;

    await handler(menuItemEvent({ price: 10 }), ctx);

    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(kv.delete).not.toHaveBeenCalledWith("unrelated");
    await expect(scheduled[0]).resolves.toBeUndefined();
    expect(kv.delete).toHaveBeenCalledWith("menu-feed");
    expect(kv.delete).toHaveBeenCalledWith("schema-jsonld");
  });

  it("ignores non-carte collections", async () => {
    const handler = getHookHandler("content:afterSave");
    const waitUntil = vi.fn();
    const ctx = { waitUntil } as unknown as PluginContext;

    await handler({ collection: "posts", content: {}, isNew: false }, ctx);

    expect(waitUntil).not.toHaveBeenCalled();
  });
});
