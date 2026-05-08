import { afterEach, describe, expect, it, vi } from "vitest";

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

const licenseHandler = () => {
  const handler = factory().routes["license-check"]?.handler;
  if (handler === undefined) throw new Error("license-check route missing");
  return handler;
};

const cachedLicenseContext = (cached: unknown): RouteContext =>
  ({
    input: { workspaceId: "ws_pen_smoke" },
    request: new Request("https://example.test/license-check"),
    kv: {
      async get<T>(): Promise<T | null> {
        return cached as T;
      },
      async set(): Promise<void> {
        throw new Error("DNS outage should not overwrite cache");
      },
    },
  }) as unknown as RouteContext;

afterEach(() => {
  vi.unstubAllGlobals();
});

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

describe("@carte/ai license pen smoke", () => {
  it("returns last-known-good license state when the license host is unreachable", async () => {
    const cached = { status: "active", plan: "trial", workspaceId: "ws_pen_smoke" };
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("DNS lookup failed")));

    const response = await licenseHandler()(cachedLicenseContext(cached));

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(200);
    await expect((response as Response).json()).resolves.toMatchObject({
      ok: true,
      degraded: true,
      license: cached,
    });
  });
});
