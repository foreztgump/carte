import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("harness probe plugin", () => {
  it("uses the pnpm-safe SandboxedPlugin const annotation", async () => {
    const source = await readFile("plugins/probe/src/plugin.ts", "utf8");

    expect(source).toContain('import type { SandboxedPlugin } from "emdash/plugin";');
    expect(source).toContain("const plugin: SandboxedPlugin =");
    expect(source).toContain("export default plugin;");
    expect(source).not.toContain("satisfies SandboxedPlugin");
  });

  it("declares the probe route in the plugin manifest", async () => {
    const manifest = await readFile("plugins/probe/emdash-plugin.jsonc", "utf8");

    expect(manifest).toContain('"slug": "carte-harness-probe"');
    expect(manifest).toContain('"route": "/ping"');
  });

  it("registers the probe plugin with the workerd sandbox runner", async () => {
    const config = await readFile("astro.config.mjs", "utf8");

    expect(config).toContain("@emdash-cms/sandbox-workerd");
    expect(config).toContain("sandboxed:");
    expect(config).toContain("sandboxRunner:");
    expect(config).toContain("probePlugin");
  });
});
