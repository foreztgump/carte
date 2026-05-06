import { describe, expect, it, vi } from "vitest";

import factory from "../index.js";

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

    await expect(handler(menuItemEvent({ price: -1 }), {})).rejects.toThrow(
      "price must be a non-negative number",
    );
  });

  it("rejects non-canonical allergen tags", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(handler(menuItemEvent({ allergens: ["made-up-allergen"] }), {})).rejects.toThrow(
      "Unknown allergen tag",
    );
  });

  it("normalizes canonical allergen tags", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: 12.5, allergens: [" Tree Nuts ", "MILK"] }), {}),
    ).resolves.toMatchObject({
      allergens: ["tree-nuts", "milk"],
    });
  });

  it("rejects malformed hours strings", async () => {
    const handler = getHookHandler("content:beforeSave");

    await expect(
      handler(menuItemEvent({ price: 12.5, hours: ["9am until late"] }), {}),
    ).rejects.toThrow("hours must use HH:mm-HH:mm format");
  });
});

describe("@carte/core content:afterSave", () => {
  it("schedules cache invalidation inside waitUntil for carte collections", async () => {
    const handler = getHookHandler("content:afterSave");
    const scheduled: Promise<unknown>[] = [];
    const waitUntil = vi.fn((promise: Promise<unknown>) => scheduled.push(promise));
    const kv = {
      delete: vi.fn(async () => true),
    };

    await handler(menuItemEvent({ price: 10 }), { kv, waitUntil });

    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(kv.delete).not.toHaveBeenCalledWith("unrelated");
    await expect(scheduled[0]).resolves.toBeUndefined();
    expect(kv.delete).toHaveBeenCalledWith("menu-feed");
    expect(kv.delete).toHaveBeenCalledWith("schema-jsonld");
  });

  it("ignores non-carte collections", async () => {
    const handler = getHookHandler("content:afterSave");
    const waitUntil = vi.fn();

    await handler({ collection: "posts", content: {}, isNew: false }, { waitUntil });

    expect(waitUntil).not.toHaveBeenCalled();
  });
});
