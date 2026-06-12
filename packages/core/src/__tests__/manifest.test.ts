import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import plugin from "../plugin.js";

const EXPECTED_CAPABILITIES = ["content:read", "content:write", "media:read"];

const stripJsonc = (source: string): string =>
  source.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1");

const manifest = JSON.parse(
  stripJsonc(
    readFileSync(fileURLToPath(new URL("../../emdash-plugin.jsonc", import.meta.url)), "utf8"),
  ),
) as {
  slug: string;
  publisher: string;
  license: string;
  capabilities: string[];
  admin: { pages: Array<{ path: string; label: string }> };
};

describe("@carte/core manifest", () => {
  it("declares the canonical trust contract in emdash-plugin.jsonc", () => {
    expect(manifest.slug).toBe("carte-core");
    expect(manifest.license).toBe("MIT");
    expect(manifest.publisher).toMatch(/^(did:plc:|[a-z0-9.-]+$)/u);
  });

  it("declares only the minimal canonical capabilities in the manifest", () => {
    expect(manifest.capabilities).toEqual(EXPECTED_CAPABILITIES);
  });

  it("declares the four Block Kit admin pages in the manifest", () => {
    expect(manifest.admin.pages.map((page) => page.path)).toEqual([
      "/carte",
      "/carte/restaurant",
      "/carte/hours",
      "/carte/settings",
    ]);
  });

  it("exposes all core route surfaces on the sandboxed plugin", () => {
    expect(Object.keys(plugin.routes ?? {}).sort()).toEqual([
      "admin",
      "admin/hours",
      "admin/restaurant",
      "admin/settings",
      "gdpr/erase",
      "gdpr/export",
      "menu-feed",
      "menu-items/86",
      "schema-jsonld",
    ]);
  });
});
