import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(HERE, "..");
const SRC_DIR = join(PACKAGE_ROOT, "src");
const MCP_SRC_DIR = join(PACKAGE_ROOT, "mcp-wrapper", "src");

const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const TEST_SUFFIXES = [".test.ts", ".test.tsx"];

const FORBIDDEN_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "DEFAULT_WORKSPACE_ID literal default",
    pattern: /DEFAULT_WORKSPACE_ID\s*=\s*["']default["']/,
  },
  { name: "workspaceId ?? 'default'", pattern: /workspaceId\s*\?\?\s*["']default["']/ },
  { name: "workspaceId || 'default'", pattern: /workspaceId\s*\|\|\s*["']default["']/ },
  { name: ".workspaceId, 'default'", pattern: /\.workspaceId\s*,\s*["']default["']/ },
  {
    name: "stringFrom(record.workspaceId, 'default')",
    pattern: /stringFrom\([^)]*workspaceId[^)]*["']default["']/,
  },
];

describe("workspaceId discipline", () => {
  it("rejects workspaceId='default' fallback anti-pattern across @carte/ai sources", () => {
    const files = [...collectSources(SRC_DIR), ...collectSources(MCP_SRC_DIR)].filter(
      (file) => !TEST_SUFFIXES.some((suffix) => file.endsWith(suffix)),
    );
    const violations: Array<{ file: string; pattern: string; line: number }> = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const lines = source.split("\n");
      for (const { name, pattern } of FORBIDDEN_PATTERNS) {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            violations.push({ file, pattern: name, line: index + 1 });
          }
        });
      }
    }
    expect(violations).toEqual([]);
  });
});

function collectSources(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      results.push(...collectSources(full));
      continue;
    }
    if (SOURCE_EXTENSIONS.some((ext) => full.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}
