import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

type RunResult = {
  exitCode: number | null;
  output: string;
};

describe("audit-sandbox-budget script", () => {
  it("exits 1 when a synthetic handler exceeds the 10-subrequest cap", async () => {
    const fixtureRoot = await createFixture(`import { definePlugin } from "emdash";

const noisyHandler = async (ctx) => {
  await ctx.kv.get("1");
  await ctx.kv.get("2");
  await ctx.kv.get("3");
  await ctx.kv.get("4");
  await ctx.kv.get("5");
  await ctx.kv.get("6");
  await ctx.kv.get("7");
  await ctx.kv.get("8");
  await ctx.kv.get("9");
  await ctx.kv.get("10");
  await ctx.kv.get("11");
  return { ok: true };
};

export default definePlugin({
  id: "fixture",
  version: "0.0.0",
  routes: { noisy: { handler: noisyHandler } },
});
`);

    const result = await runAuditor("--root", fixtureRoot);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("| route | est-CPU-ms | subrequest-count | budget-margin |");
    expect(result.output).toContain("packages/core/src/noisy");
    expect(result.output).toContain("11");
    expect(result.output).toContain("FAIL");
  });

  it("exits 0 and prints the Markdown budget table for v0.1 sandboxed plugins", async () => {
    const result = await runAuditor();

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("| route | est-CPU-ms | subrequest-count | budget-margin |");
    expect(result.output).toContain("packages/core/src/schema-jsonld");
    expect(result.output).toContain("packages/reservations/src/submit");
    expect(result.output).toContain("packages/orders-backend/src/webhook-stripe");
  });
});

const createFixture = async (source: string): Promise<string> => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "carte-sandbox-budget-"));
  const sourcePath = path.join(fixtureRoot, "packages/core/src/index.ts");
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, source, "utf8");
  return fixtureRoot;
};

const runAuditor = async (...args: string[]): Promise<RunResult> =>
  new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["run", "audit:sandbox-budget", ...args], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", reject);
    child.on("close", (exitCode) =>
      resolve({ exitCode, output: Buffer.concat(chunks).toString("utf8") }),
    );
  });
