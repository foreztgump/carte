import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("probe route source", () => {
  it("exports a ping route for harness smoke checks", async () => {
    const source = await readFile(new URL("../src/plugin.ts", import.meta.url), "utf8");

    expect(source).toContain("ping:");
    expect(source).toContain("ok: true");
    expect(source).toContain("export default plugin;");
  });
});
