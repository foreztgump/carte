import { describe, expect, it, vi } from "vitest";

import factory from "../../index.js";
import {
  ALLERGEN_TAGS,
  DIETARY_TAG_TO_SCHEMA_URI,
  EU_FIC_14_ALLERGENS,
  US_ALLERGEN_EXTENSIONS,
} from "../allergens.js";

import type { PluginContext } from "emdash";

const EU_FIC_14 = [
  "celery",
  "cereals-containing-gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "peanuts",
  "sesame",
  "soybeans",
  "sulphur-dioxide-and-sulphites",
  "tree-nuts",
] as const;

const getAfterSaveHandler = () => {
  const hook = factory().hooks["content:afterSave"];
  if (!hook) throw new Error("Missing content:afterSave hook");
  return hook.handler;
};

describe("@carte/core allergen taxonomy", () => {
  it("exports exactly the EU FIC 14 allergens plus US extensions", () => {
    expect(EU_FIC_14_ALLERGENS).toEqual(EU_FIC_14);
    expect(US_ALLERGEN_EXTENSIONS).toEqual(["corn"]);
    expect(ALLERGEN_TAGS).toEqual([...EU_FIC_14, "corn"]);
  });

  it("maps dietary tags to canonical schema.org diet URIs", () => {
    expect(DIETARY_TAG_TO_SCHEMA_URI.vegetarian).toBe("https://schema.org/VegetarianDiet");
    expect(DIETARY_TAG_TO_SCHEMA_URI.vegan).toBe("https://schema.org/VeganDiet");
    expect(DIETARY_TAG_TO_SCHEMA_URI.glutenFree).toBe("https://schema.org/GlutenFreeDiet");

    for (const uri of Object.values(DIETARY_TAG_TO_SCHEMA_URI)) {
      expect(uri).toMatch(/^https:\/\/schema\.org\/[A-Za-z]+Diet$/);
    }
  });
});

describe("@carte/core allergen audit", () => {
  it("emits an audit entry when menu item allergens change", async () => {
    const scheduled: Promise<unknown>[] = [];
    const content = { create: vi.fn(async () => ({ id: "audit-1" })) };
    const waitUntil = vi.fn((promise: Promise<unknown>) => scheduled.push(promise));
    const ctx = {
      content,
      kv: { delete: vi.fn(async () => true) },
      waitUntil,
      actor: { id: "admin-1" },
    } as unknown as PluginContext;

    await getAfterSaveHandler()(
      {
        collection: "carte_menu_items",
        content: { id: "item-1", allergens: ["milk", "eggs"] },
        previousContent: { allergens: ["milk"] },
        isNew: false,
      } as never,
      ctx,
    );

    expect(waitUntil).toHaveBeenCalledTimes(2);
    await Promise.all(scheduled);
    expect(content.create).toHaveBeenCalledWith("carte_audit_log", {
      action: "menu_item_allergens_changed",
      actor: "admin-1",
      before: ["milk"],
      after: ["milk", "eggs"],
      targetCollection: "carte_menu_items",
      targetId: "item-1",
      timestamp: expect.any(String),
    });
  });
});
