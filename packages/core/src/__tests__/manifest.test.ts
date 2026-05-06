import { describe, expect, it } from "vitest";

import factory from "../index.js";

const EXPECTED_CAPABILITIES = ["content:read", "content:write", "media:read"];

describe("@carte/core manifest", () => {
  it("declares only the minimal canonical capabilities", () => {
    const manifest = factory();

    expect(manifest.capabilities).toEqual(EXPECTED_CAPABILITIES);
  });

  it("declares settings defaults and all core route surfaces", () => {
    const manifest = factory();

    expect(manifest.admin.settingsSchema).toMatchObject({
      defaultCurrency: { default: "USD" },
      defaultMenuLocale: { default: "en" },
      timezone: { default: "America/Los_Angeles" },
      x402WalletAddress: { default: "" },
    });
    expect(Object.keys(manifest.routes).sort()).toEqual([
      "admin",
      "admin/hours",
      "admin/restaurant",
      "admin/settings",
      "menu-feed",
      "menu-items/86",
      "schema-jsonld",
    ]);
  });
});
