import { describe, expect, it, vi } from "vitest";

import {
  checkLicense,
  resolveAccessState,
  sanitizeTelemetry,
  TRIAL_DURATION_MS,
} from "./license.js";
import { storeWorkspaceLlmKey, readWorkspaceLlmKey } from "./workspace-secrets.js";

const workspaceId = "workspace_123";
const now = new Date("2026-05-08T12:00:00.000Z");

const createKv = () => {
  const entries = new Map<string, unknown>();
  const expirations = new Map<string, number>();
  return {
    entries,
    expirations,
    async get<T>(key: string): Promise<T | null> {
      return (entries.get(key) as T | undefined) ?? null;
    },
    async put(key: string, value: unknown, options?: { expirationTtl?: number }): Promise<void> {
      entries.set(key, value);
      if (options?.expirationTtl !== undefined) {
        expirations.set(key, options.expirationTtl);
      }
    },
  };
};

describe("license checks", () => {
  it("caches license server responses for 24 hours and hits cache first", async () => {
    const kv = createKv();
    const fetchLicense = vi.fn(async () => ({ status: "licensed" as const, plan: "pro" }));

    await checkLicense({ workspaceId, kv, now, fetchLicense });
    const second = await checkLicense({ workspaceId, kv, now, fetchLicense });

    expect(fetchLicense).toHaveBeenCalledTimes(1);
    expect(second.source).toBe("cache");
    expect(kv.expirations.get(`license:${workspaceId}`)).toBe(86_400);
  });

  it("uses last-known-good cache on outage and starts trial mode without cache", async () => {
    const cachedKv = createKv();
    await cachedKv.put(`license:${workspaceId}`, { status: "licensed", plan: "pro" });
    const failingFetch = vi.fn(async () => {
      throw new Error("license.carteplugin.dev unavailable");
    });

    const cached = await checkLicense({
      workspaceId,
      kv: cachedKv,
      now,
      fetchLicense: failingFetch,
    });
    const trial = await checkLicense({
      workspaceId,
      kv: createKv(),
      now,
      fetchLicense: failingFetch,
    });

    expect(cached.state.access).toBe("licensed");
    expect(cached.banner).toContain("cached license");
    expect(trial.state.access).toBe("trial");
    expect(trial.banner).toContain("trial mode");
  });
});

describe("trial state machine", () => {
  it("transitions none to trial, trial to expired, then licensed or blocked-with-grace", async () => {
    const kv = createKv();
    const first = await resolveAccessState({ workspaceId, kv, now });
    const expired = await resolveAccessState({
      workspaceId,
      kv,
      now: new Date(now.getTime() + TRIAL_DURATION_MS + 1),
    });
    const licensed = await resolveAccessState({
      workspaceId,
      kv,
      now,
      license: { status: "licensed", plan: "pro" },
    });
    const revoked = await resolveAccessState({
      workspaceId,
      kv,
      now,
      license: { status: "revoked", plan: "pro" },
    });

    expect(first.access).toBe("trial");
    expect(expired.access).toBe("expired");
    expect(licensed.access).toBe("licensed");
    expect(revoked.access).toBe("blocked-with-grace");
  });
});

describe("workspace LLM keys", () => {
  it("stores provider keys as workspace-scoped secrets and rejects cross-workspace reads", async () => {
    const secrets = new Map<string, string>();
    await storeWorkspaceLlmKey({
      workspaceId,
      provider: "anthropic",
      value: "anthropic-fixture-key",
      secrets,
    });

    await expect(
      readWorkspaceLlmKey({ workspaceId, provider: "anthropic", secrets }),
    ).resolves.toBe("anthropic-fixture-key");
    await expect(
      readWorkspaceLlmKey({ workspaceId: "workspace_other", provider: "anthropic", secrets }),
    ).resolves.toBeNull();
  });
});

describe("telemetry safety", () => {
  it("redacts PII fields before telemetry records leave the boundary", () => {
    const event = sanitizeTelemetry({
      workspaceId,
      email: "guest@example.com",
      phone: "+15555550123",
      notes: "Birthday surprise",
      message: "Generate menu description",
    });

    expect(JSON.stringify(event)).not.toContain("guest@example.com");
    expect(JSON.stringify(event)).not.toContain("+15555550123");
    expect(JSON.stringify(event)).not.toContain("Birthday surprise");
  });
});
