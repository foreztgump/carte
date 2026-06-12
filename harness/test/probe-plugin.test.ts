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
    expect(manifest).toContain('"capabilities": []');
  });

  it("exposes the ping route from the plugin entrypoint", async () => {
    const source = await readFile(probeEntry, "utf8");

    expect(source).toContain("ping:");
    expect(source).toContain("public: true");
    expect(source).toContain("ok: true");
  });

  it("registers the probe plugin with the workerd sandbox runner", async () => {
    const config = await readFile(astroConfig, "utf8");

    expect(config).toContain("@emdash-cms/sandbox-workerd");
    expect(config).toContain("sandboxed:");
    expect(config).toContain("sandboxRunner:");
    expect(config).toContain("probePlugin");
  });
});
