import type { RouteContext } from "emdash";
import { describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import factory, { licenseCheckRoute } from "./index.js";

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
    expect(manifest.version).toBe("0.3.0-rc.1");
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

  it("is native and does not ship a main-package wrangler config", () => {
    const manifest = factory();
    const packageRoot = join(process.cwd(), "wrangler.toml");

    expect(existsSync(packageRoot)).toBe(false);
    expect(manifest.admin?.entry).toBe("@carte/ai/admin");
  });
});

describe("licenseCheckRoute workspace isolation", () => {
  it("rejects requests without an X-Workspace-Id header instead of using 'default'", async () => {
    const kv = createLicenseKv();
    const fetchLicense = vi.fn(async () => ({ status: "licensed" as const, plan: "pro" }));
    const ctx = routeContextFor({
      headers: { "Content-Type": "application/json" },
      kv,
      input: {},
    });

    await expect(licenseCheckRoute(ctx, { fetchLicense })).rejects.toThrow(/X-Workspace-Id/);
    expect(fetchLicense).not.toHaveBeenCalled();
    expect(kv.entries.has("license:default")).toBe(false);
  });

  it("isolates license cache and trial state per workspace id from the request header", async () => {
    const kv = createLicenseKv();
    const fetchLicense = vi.fn(async (workspaceId: string) =>
      workspaceId === "ws-expired"
        ? ({ status: "expired", plan: "pro" } as const)
        : ({ status: "licensed", plan: "pro" } as const),
    );

    const fresh = await licenseCheckRoute(
      routeContextFor({
        headers: { "X-Workspace-Id": "ws-fresh" },
        kv,
        input: {},
      }),
      { fetchLicense },
    );
    const expired = await licenseCheckRoute(
      routeContextFor({
        headers: { "X-Workspace-Id": "ws-expired" },
        kv,
        input: {},
      }),
      { fetchLicense },
    );

    expect(fetchLicense).toHaveBeenCalledTimes(2);
    expect(fetchLicense).toHaveBeenNthCalledWith(1, "ws-fresh");
    expect(fetchLicense).toHaveBeenNthCalledWith(2, "ws-expired");
    expect(fresh).toMatchObject({ source: "network", state: { access: "licensed" } });
    expect(expired).toMatchObject({
      source: "network",
      state: { access: "blocked-with-grace" },
    });
    expect(kv.entries.get("license:ws-fresh")).toMatchObject({ status: "licensed" });
    expect(kv.entries.get("license:ws-expired")).toMatchObject({ status: "expired" });
    expect(kv.entries.has("license:default")).toBe(false);
  });
});

interface RouteContextFixture {
  headers: Record<string, string>;
  kv: ReturnType<typeof createLicenseKv>;
  input: Record<string, unknown>;
}

function routeContextFor(fixture: RouteContextFixture): RouteContext {
  return {
    input: fixture.input,
    kv: fixture.kv,
    request: new Request("https://carte.test/_emdash/api/plugins/carte-ai/license-check", {
      body: JSON.stringify(fixture.input),
      headers: fixture.headers,
      method: "POST",
    }),
  } as unknown as RouteContext;
}

function createLicenseKv() {
  const entries = new Map<string, unknown>();
  return {
    entries,
    async get<T>(key: string): Promise<T | null> {
      return (entries.get(key) as T | undefined) ?? null;
    },
    async put(key: string, value: unknown): Promise<void> {
      entries.set(key, value);
    },
  };
}
