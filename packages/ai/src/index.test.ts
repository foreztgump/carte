import { describe, expect, it } from "vitest";

import factory from "./index.js";

const CANONICAL_CAPABILITIES = new Set([
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "network:request",
  "email:send",
  "users:read",
]);

describe("@carte/ai manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-ai");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names only and pins LLM + license hosts", () => {
    const manifest = factory();
    for (const cap of manifest.capabilities) {
      expect(CANONICAL_CAPABILITIES.has(cap)).toBe(true);
    }
    expect(manifest.capabilities).toContain("network:request");
    expect(manifest.capabilities).not.toContain("network:request:unrestricted");
    expect(manifest.allowedHosts).toEqual(
      expect.arrayContaining([
        "api.anthropic.com",
        "api.openai.com",
        "generativelanguage.googleapis.com",
        "license.carteplugin.dev",
      ]),
    );
  });
});
