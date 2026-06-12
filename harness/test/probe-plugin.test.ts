import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const harnessRoot = new URL("../", import.meta.url);
const probeEntry = new URL("plugins/probe/src/plugin.ts", harnessRoot);
const probeManifest = new URL("plugins/probe/emdash-plugin.jsonc", harnessRoot);
const astroConfig = new URL("astro.config.mjs", harnessRoot);

describe("harness probe plugin", () => {
  it("uses the pnpm-safe SandboxedPlugin const annotation", async () => {
    const source = await readFile(probeEntry, "utf8");

    expect(source).toContain('import type { SandboxedPlugin } from "emdash/plugin";');
    expect(source).toContain("const plugin: SandboxedPlugin =");
    expect(source).toContain("export default plugin;");
    expect(source).not.toContain("satisfies SandboxedPlugin");
  });

  it("declares the probe plugin slug in the manifest", async () => {
    const manifest = await readFile(probeManifest, "utf8");

    expect(manifest).toContain('"slug": "carte-harness-probe"');
    expect(manifest).toContain('"content:read"');
    expect(manifest).toContain('"content:write"');
  });

  it("declares indexed and unique indexed storage collections", async () => {
    const manifest = await readFile(probeManifest, "utf8");

    expect(manifest).toContain('"storage": {');
    expect(manifest).toContain('"probe_claims"');
    expect(manifest).toContain('"indexes": ["kind", "slotKey"]');
    expect(manifest).toContain('"uniqueIndexes": ["slotKey"]');
  });

  it("declares Block Kit admin pages with label fields", async () => {
    const manifest = await readFile(probeManifest, "utf8");

    expect(manifest).toContain('"admin": {');
    expect(manifest).toContain('"label": "Probe"');
    expect(manifest).not.toContain('"text": "Probe"');
  });

  it("exposes the ping route from the plugin entrypoint", async () => {
    const source = await readFile(probeEntry, "utf8");

    expect(source).toContain("ping:");
    expect(source).toContain("public: true");
    expect(source).toContain("ok: true");
    expect(source).toContain("private:");
    expect(source).toContain("uniqueConflict:");
    expect(source).toContain("postResponsePrimitive:");
  });

  it("registers content hook probes for documented event shapes", async () => {
    const source = await readFile(probeEntry, "utf8");

    expect(source).toContain('"content:beforeSave"');
    expect(source).toContain('"content:afterSave"');
    expect(source).toContain("isNew");
    expect(source).toContain("collection");
    expect(source).toContain("content");
  });

  it("registers the probe plugin with the workerd sandbox runner", async () => {
    const config = await readFile(astroConfig, "utf8");

    expect(config).toContain("@emdash-cms/sandbox-workerd");
    expect(config).toContain("sandboxed:");
    expect(config).toContain("sandboxRunner:");
    expect(config).toContain("probePlugin");
  });

  it("registers a native definePlugin probe with settingsSchema", async () => {
    const config = await readFile(astroConfig, "utf8");

    expect(config).toContain('import { definePlugin } from "emdash";');
    expect(config).toContain("nativeProbePlugin()");
    expect(config).toContain("plugins:");
    expect(config).toContain("settingsSchema");
    expect(config).toContain('label: "Probe enabled"');
  });
});
