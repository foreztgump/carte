# PRO-894 Reconcile Tender SDK Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the packed `@carte/orders-backend` package self-contained, with no published `@tender/sdk` dependency or vendored tarball leak, while keeping local build/typecheck/test green.

**Architecture:** Use the existing `emdash-plugin build` behavior that inlines `@tender/sdk` into `dist/plugin.mjs`. Move the vendored SDK to the private workspace root as a build/test input, remove it from the published package manifest, and add a pack/install verifier that proves the npm tarball has no `@tender/sdk` reference.

**Tech Stack:** TypeScript, pnpm 10.19.0, Node 22, EmDash plugin CLI 0.5.1, Vitest, Changesets, OpenSpec.

---

## File Structure

- Modify `package.json`: root-only private devDependency for `@tender/sdk`, add `verify:orders-backend-pack`.
- Modify `.npmrc`: add `public-hoist-pattern[]=@tender/sdk`.
- Modify `packages/orders-backend/package.json`: remove the `@tender/sdk` devDependency.
- Create `scripts/verify-orders-backend-pack.ts`: pack tarball, assert manifest/file contents, clean-install and import built entrypoints.
- Modify `MIGRATION.md` and `packages/orders-backend/README.md`: document self-contained bundled SDK contract.
- Create `.changeset/pro-894-orders-backend-tender-sdk.md`: patch changeset.
- Modify `openspec/changes/pro-894-reconcile-tender-sdk/tasks.md`: check completed tasks after evidence exists.

## Quality Checklist Applied to Every Task

- [ ] Each function does one thing (SRP)
- [ ] No magic values, literals are named constants
- [ ] Functions ≤40 lines, ≤3 parameters, ≤3 nesting levels
- [ ] All async operations and external boundaries have error handling
- [ ] Names reveal intent, no abbreviations or generic names
- [ ] No duplicated logic blocks
- [ ] YAGNI, only what PRO-894 requires
- [ ] Law of Demeter, no chaining through objects
- [ ] File structure follows this plan

## Task 1: Move the SDK build input to private root scope

**Files:**

- Modify `package.json`
- Modify `.npmrc`

- [ ] **Step 1: Edit root package manifest**

Add this entry to root `devDependencies`, keeping JSON sorted by existing style:

```json
"@tender/sdk": "file:./vendor/tender-sdk-0.0.0.tgz"
```

Confirm `"private": true` remains unchanged.

- [ ] **Step 2: Edit `.npmrc`**

Append this line after `public-hoist-pattern[]=tsx`:

```ini
public-hoist-pattern[]=@tender/sdk
```

- [ ] **Step 3: Verify manifest/config**

Run:

```bash
node -e "const p=require('./package.json'); if (!p.private) throw new Error('root must stay private'); if (p.devDependencies['@tender/sdk'] !== 'file:./vendor/tender-sdk-0.0.0.tgz') throw new Error('missing root SDK input')"
grep -Fx 'public-hoist-pattern[]=@tender/sdk' .npmrc
```

Expected: both commands exit 0.

## Task 2: Remove SDK from the published orders-backend manifest

**Files:**

- Modify `packages/orders-backend/package.json`

- [ ] **Step 1: Delete package-local SDK dependency**

Remove only this entry from `packages/orders-backend/package.json`:

```json
"@tender/sdk": "file:../../vendor/tender-sdk-0.0.0.tgz"
```

Do not add `@tender/sdk` to `dependencies`, `peerDependencies`, `peerDependenciesMeta`, or `optionalDependencies`.

- [ ] **Step 2: Verify no package-local SDK reference**

Run:

```bash
node -e "const p=require('./packages/orders-backend/package.json'); for (const field of ['dependencies','devDependencies','peerDependencies','peerDependenciesMeta','optionalDependencies']) if (p[field]?.['@tender/sdk']) throw new Error(field + ' leaks @tender/sdk')"
```

Expected: exits 0.

## Task 3: Reinstall and prove workspace build/test resolution

**Files:**

- Modify `pnpm-lock.yaml`
- Build output under `packages/orders-backend/dist/`

- [ ] **Step 1: Reinstall with pnpm**

Run:

```bash
pnpm install
```

Expected: exits 0 and updates `pnpm-lock.yaml`.

- [ ] **Step 2: Build orders-backend**

Run:

```bash
pnpm -F @carte/orders-backend build
```

Expected: exits 0, `packages/orders-backend/dist/index.mjs` and `packages/orders-backend/dist/plugin.mjs` exist.

- [ ] **Step 3: Typecheck and test orders-backend**

Run:

```bash
pnpm -F @carte/orders-backend typecheck
pnpm -F @carte/orders-backend test
```

Expected: both exit 0, including `tender-sdk-link.smoke.test.ts`.

## Task 4: Add pack/install verification

**Files:**

- Create `scripts/verify-orders-backend-pack.ts`
- Modify `package.json`

- [ ] **Step 1: Add verifier script**

Create `scripts/verify-orders-backend-pack.ts` with these units:

```ts
#!/usr/bin/env tsx
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const PACKAGE_NAME = "@carte/orders-backend";
const PACKAGE_DIR = path.resolve("packages/orders-backend");
const TEMP_PREFIX = path.join(os.tmpdir(), "carte-orders-pack-");
const FORBIDDEN_DEPENDENCY = "@tender/sdk";
const FORBIDDEN_PATH_PARTS = ["vendor/", "tender-sdk-0.0.0.tgz", "file:"];
const ALLOWED_TARBALL_ROOTS = ["package/dist/", "package/emdash-plugin.jsonc"];
const ALLOWED_TARBALL_FILES = ["package/package.json", "package/README.md"];

try {
  const tempDir = await mkdtemp(TEMP_PREFIX);
  try {
    const tarballPath = await packPackage(tempDir);
    const fileList = await listTarball(tarballPath);
    const manifest = await readPackedManifest(tarballPath, tempDir);
    assertManifest(manifest);
    assertFileList(fileList);
    await assertCleanInstall(tarballPath, tempDir);
    console.log(`PASS: ${PACKAGE_NAME} pack is self-contained.`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

async function packPackage(tempDir: string): Promise<string> {
  const output = await run("pnpm", ["pack", "--pack-destination", tempDir], PACKAGE_DIR);
  const tarballName = output
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.endsWith(".tgz"));
  if (!tarballName) throw new Error("pnpm pack did not report a tarball.");
  return path.join(tempDir, path.basename(tarballName));
}

async function listTarball(tarballPath: string): Promise<string[]> {
  const output = await run("tar", ["-tzf", tarballPath], process.cwd());
  return output.split("\n").filter(Boolean).sort();
}

async function readPackedManifest(
  tarballPath: string,
  tempDir: string,
): Promise<Record<string, unknown>> {
  const output = await run("tar", ["-xOf", tarballPath, "package/package.json"], tempDir);
  return JSON.parse(output) as Record<string, unknown>;
}

function assertManifest(manifest: Record<string, unknown>): void {
  for (const field of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "peerDependenciesMeta",
    "optionalDependencies",
  ]) {
    const dependencies = manifest[field];
    if (isObject(dependencies) && FORBIDDEN_DEPENDENCY in dependencies) {
      throw new Error(`Packed manifest leaks ${FORBIDDEN_DEPENDENCY} in ${field}.`);
    }
    const serialized = JSON.stringify(dependencies ?? {});
    if (FORBIDDEN_PATH_PARTS.some((part) => serialized.includes(part))) {
      throw new Error(`Packed manifest contains forbidden path or file spec in ${field}.`);
    }
  }
}

function assertFileList(fileList: string[]): void {
  for (const file of fileList) {
    if (
      FORBIDDEN_PATH_PARTS.some((part) => file.includes(part)) ||
      file.startsWith("package/src/")
    ) {
      throw new Error(`Packed tarball contains forbidden file: ${file}`);
    }
    if (!isAllowedTarballFile(file)) throw new Error(`Unexpected packed file: ${file}`);
  }
}

function isAllowedTarballFile(file: string): boolean {
  return (
    ALLOWED_TARBALL_FILES.includes(file) ||
    ALLOWED_TARBALL_ROOTS.some((root) => file.startsWith(root))
  );
}

async function assertCleanInstall(tarballPath: string, tempDir: string): Promise<void> {
  const appDir = path.join(tempDir, "consumer");
  await writeFile(
    path.join(tempDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  await run("mkdir", ["-p", appDir], process.cwd());
  await writeFile(
    path.join(appDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  await run("npm", ["install", "--ignore-scripts", tarballPath], appDir);
  await run(
    "node",
    [
      "--input-type=module",
      "-e",
      "await import('@carte/orders-backend'); await import('@carte/orders-backend/sandbox');",
    ],
    appDir,
  );
}

async function run(command: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const output = Buffer.concat(stdout).toString();
      const errorOutput = Buffer.concat(stderr).toString();
      if (code === 0) resolve(output);
      else
        reject(
          new Error(`${command} ${args.join(" ")} failed (${code}): ${errorOutput || output}`),
        );
    });
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
```

- [ ] **Step 2: Add root script**

Add to root `package.json` scripts:

```json
"verify:orders-backend-pack": "tsx scripts/verify-orders-backend-pack.ts"
```

- [ ] **Step 3: Run verifier**

Run:

```bash
pnpm verify:orders-backend-pack
```

Expected: exits 0 and prints `PASS: @carte/orders-backend pack is self-contained.`

## Task 5: Update docs and changeset

**Files:**

- Modify `MIGRATION.md`
- Modify `packages/orders-backend/README.md`
- Create `.changeset/pro-894-orders-backend-tender-sdk.md`

- [ ] **Step 1: Update migration instructions**

Replace the `@tender/sdk` peer install paragraph and command with:

```md
`@carte/orders-backend` ships as a self-contained sandbox bundle: the Tender SDK
client is inlined into the built `dist/` output, so operators do not install
`@tender/sdk` directly for this Carte release. Install and configure
`tender-core` and `tender-stripe` when the Tender family is available; until then
paid order flows remain inert as described below.
```

- [ ] **Step 2: Update package README**

Add this paragraph after the execution model/capability paragraph:

```md
Tender SDK packaging: the published package is self-contained. The SDK is a
workspace-private build input that is bundled into `dist/`; `@tender/sdk` is not
declared as a runtime, peer, optional, or dev dependency in the packed package.
```

- [ ] **Step 3: Add changeset**

Create `.changeset/pro-894-orders-backend-tender-sdk.md`:

```md
---
"@carte/orders-backend": patch
---

Reconcile the Tender SDK packaging shape so the published package is
self-contained and does not expose the vendored build-time SDK tarball.
```

## Task 6: Full regression and OpenSpec completion

**Files:**

- Modify `openspec/changes/pro-894-reconcile-tender-sdk/tasks.md`

- [ ] **Step 1: Run package and workspace validators**

Run:

```bash
pnpm verify:orders-backend-pack
pnpm -r build
pnpm -r typecheck
pnpm test
```

Expected: all exit 0.

- [ ] **Step 2: Validate OpenSpec**

Run:

```bash
openspec validate pro-894-reconcile-tender-sdk --strict
```

Expected: exits 0.

- [ ] **Step 3: Mark tasks complete**

After all evidence is green, change every task checkbox in `openspec/changes/pro-894-reconcile-tender-sdk/tasks.md` from `[ ]` to `[x]`.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected: only PRO-894 files changed, no whitespace errors.

## Self-Review

- Spec coverage: Task 2 and Task 4 cover published manifest requirements; Task 4 covers clean install and tarball contents; Task 3 covers workspace SDK resolution; Task 5 covers documented contract drift.
- Placeholder scan: no TBD/TODO/fill-in steps.
- Type consistency: verifier helpers use single-purpose functions and constants named in the plan.
