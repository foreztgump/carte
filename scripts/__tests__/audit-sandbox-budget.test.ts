import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
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
type CostCaps = {
  cpuMs: number;
  subrequests: number;
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

    const auditResult = await runAuditor("--root", fixtureRoot);

    expect(auditResult.exitCode).toBe(1);
    expect(auditResult.output).toContain(
      "| route | est-CPU-ms | subrequest-count | budget-margin |",
    );
    expect(auditResult.output).toContain("packages/core/src/noisy");
    expect(auditResult.output).toContain("11");
    expect(auditResult.output).toContain("FAIL");
  });

  it("exits 0 and prints the Markdown budget table for v0.1 sandboxed plugins", async () => {
    const auditResult = await runAuditor();

    expect(auditResult.exitCode).toBe(0);
    expect(auditResult.output).toContain(
      "| route | est-CPU-ms | subrequest-count | budget-margin |",
    );
    expect(auditResult.output).toContain("packages/core/src/schema-jsonld");
    expect(auditResult.output).toContain("packages/reservations/src/plugin/submit");
    expect(auditResult.output).toContain("packages/orders-backend/src/plugin/checkout");
  });

  it("formats budget margins with caps from the active cost table", async () => {
    const fixtureRoot = await createFixture(
      `export default {
  routes: {
    compact: {
      handler: async (ctx) => {
        await ctx.kv.get("1");
        await ctx.kv.get("2");
        await ctx.kv.get("3");
        await ctx.kv.get("4");
        return { ok: true };
      },
    },
  },
};
`,
      { cpuMs: 100, subrequests: 20 },
    );

    const auditResult = await runAuditor("--root", fixtureRoot);

    expect(auditResult.exitCode).toBe(0);
    expect(auditResult.output).toContain("PASS (16 subreq, 91.95ms CPU)");
  });
});

const createFixture = async (source: string, caps?: CostCaps): Promise<string> => {
  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "carte-sandbox-budget-"));
  const sourcePath = path.join(fixtureRoot, "packages/core/src/index.ts");
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, source, "utf8");
  if (caps) await writeCostTable(fixtureRoot, caps);
  return fixtureRoot;
};

const writeCostTable = async (fixtureRoot: string, caps: CostCaps): Promise<void> => {
  const tablePath = path.join(fixtureRoot, "scripts/sandbox-cost-table.json");
  const rawTable = await readFile(path.join(REPO_ROOT, "scripts/sandbox-cost-table.json"), "utf8");
  const costTable = { ...JSON.parse(rawTable), caps };
  await mkdir(path.dirname(tablePath), { recursive: true });
  await writeFile(tablePath, JSON.stringify(costTable), "utf8");
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
