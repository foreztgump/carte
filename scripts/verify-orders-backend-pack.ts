#!/usr/bin/env tsx
import { execFile as execFileCallback } from "node:child_process";
import { access, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const PACKAGE_NAME = "@carte/orders-backend";
const PACKAGE_IMPORTS = ["@carte/orders-backend", "@carte/orders-backend/sandbox"] as const;
const PACKAGE_FILTER = "@carte/orders-backend";
const TEMP_PREFIX = "carte-orders-backend-pack-";
const PACK_DIRECTORY_NAME = "pack";
const INSTALL_DIRECTORY_NAME = "install";
const TARBALL_EXTENSION = ".tgz";
const TARBALL_MANIFEST_PATH = "package/package.json";
const TARBALL_ROOT_PREFIX = "package/";
const PACKAGE_JSON_FILE = "package.json";
const PACKAGE_README_FILE = "README.md";
const PLUGIN_MANIFEST_FILE = "emdash-plugin.jsonc";
const DIST_PREFIX = "dist/";
const SRC_PREFIX = "src/";
const VENDOR_PREFIX = "vendor/";
const VENDOR_FRAGMENT = "vendor/";
const FILE_SPECIFIER_PREFIX = "file:";
const TENDER_PACKAGE_NAME = "@tender/sdk";
const TENDER_TARBALL_FILE = "tender-sdk-0.0.0.tgz";
const CLEAN_PROJECT_NAME = "orders-backend-pack-smoke";
const NODE_MODULES_TENDER_PATH = path.join("node_modules", "@tender", "sdk");
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "optionalDependencies",
] as const;
const STANDARD_METADATA_FILES = new Set([
  "package.json",
  "readme",
  "readme.md",
  "license",
  "license.md",
  "licence",
  "licence.md",
  "notice",
  "notice.md",
  "changelog.md",
]);
const execFile = promisify(execFileCallback);

type JsonObject = Record<string, unknown>;
type CommandResult = { stdout: string; stderr: string };
type CommandFailureInput = {
  command: string;
  args: readonly string[];
  cwd: string;
  error: unknown;
};

const tempRoot = await mkdtemp(path.join(tmpdir(), TEMP_PREFIX));

try {
  const packDirectory = await prepareDirectory(tempRoot, PACK_DIRECTORY_NAME);
  const installDirectory = await prepareDirectory(tempRoot, INSTALL_DIRECTORY_NAME);
  const tarballPath = await packOrdersBackend(packDirectory);
  const manifest = await readPackedManifest(tarballPath);
  const files = await listPackedFiles(tarballPath);

  assertManifest(manifest);
  assertFileList(files);
  await assertCleanInstall({ installDirectory, tarballPath });
  console.log(`OK: ${PACKAGE_NAME} pack is self-contained and clean-installable.`);
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

async function prepareDirectory(root: string, name: string): Promise<string> {
  const directory = path.join(root, name);
  await mkdir(directory, { recursive: true });
  return directory;
}

async function packOrdersBackend(packDirectory: string): Promise<string> {
  await runCommand("pnpm", [
    "--filter",
    PACKAGE_FILTER,
    "pack",
    "--pack-destination",
    packDirectory,
  ]);
  return findPackedTarball(packDirectory);
}

async function findPackedTarball(packDirectory: string): Promise<string> {
  const entries = await readdir(packDirectory);
  const tarballs = entries.filter((entry) => entry.endsWith(TARBALL_EXTENSION));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one packed ${TARBALL_EXTENSION} file, found: ${tarballs.join(", ")}`);
  }
  return path.join(packDirectory, tarballs[0] as string);
}

async function readPackedManifest(tarballPath: string): Promise<JsonObject> {
  const { stdout } = await runCommand("tar", ["-xOf", tarballPath, TARBALL_MANIFEST_PATH]);
  const manifest = JSON.parse(stdout) as unknown;
  if (!isObject(manifest)) throw new Error(`${TARBALL_MANIFEST_PATH} must be a JSON object.`);
  return manifest;
}

async function listPackedFiles(tarballPath: string): Promise<string[]> {
  const { stdout } = await runCommand("tar", ["-tzf", tarballPath]);
  return stdout.split("\n").filter(Boolean).map(normalizePackedPath).filter(Boolean);
}

function normalizePackedPath(filePath: string): string {
  return filePath.startsWith(TARBALL_ROOT_PREFIX)
    ? filePath.slice(TARBALL_ROOT_PREFIX.length)
    : filePath;
}

function assertManifest(manifest: JsonObject): void {
  assertNoTenderDependency(manifest);
  assertNoForbiddenManifestSpecifiers(manifest);
}

function assertNoTenderDependency(manifest: JsonObject): void {
  for (const field of DEPENDENCY_FIELDS) {
    const value = manifest[field];
    if (!isObject(value) || !(TENDER_PACKAGE_NAME in value)) continue;
    throw new Error(`Manifest field ${field}.${TENDER_PACKAGE_NAME} must not be published.`);
  }
}

function assertNoForbiddenManifestSpecifiers(manifest: JsonObject): void {
  for (const field of DEPENDENCY_FIELDS) {
    for (const violation of forbiddenManifestSpecifiers(manifest[field], field)) {
      throw new Error(
        `Manifest field ${violation.field} contains forbidden specifier ${violation.specifier}.`,
      );
    }
  }
}

function forbiddenManifestSpecifiers(
  value: unknown,
  fieldPath: string,
): Array<{ field: string; specifier: string }> {
  if (typeof value === "string") return forbiddenStringSpecifiers(value, fieldPath);
  if (Array.isArray(value)) return forbiddenArraySpecifiers(value, fieldPath);
  if (!isObject(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    forbiddenManifestSpecifiers(nested, `${fieldPath}.${key}`),
  );
}

function forbiddenStringSpecifiers(
  value: string,
  fieldPath: string,
): Array<{ field: string; specifier: string }> {
  if (value.includes(FILE_SPECIFIER_PREFIX)) {
    return [{ field: fieldPath, specifier: FILE_SPECIFIER_PREFIX }];
  }
  if (value.includes(VENDOR_FRAGMENT)) return [{ field: fieldPath, specifier: VENDOR_FRAGMENT }];
  return [];
}

function forbiddenArraySpecifiers(
  values: readonly unknown[],
  fieldPath: string,
): Array<{ field: string; specifier: string }> {
  return values.flatMap((value, index) =>
    forbiddenManifestSpecifiers(value, `${fieldPath}[${index}]`),
  );
}

function assertFileList(files: readonly string[]): void {
  for (const file of files) {
    assertAllowedFile(file);
  }
}

function assertAllowedFile(file: string): void {
  if (isForbiddenPackedFile(file)) throw new Error(`Packed file ${file} is forbidden.`);
  if (file.startsWith(DIST_PREFIX)) return;
  if (file === PLUGIN_MANIFEST_FILE || file === PACKAGE_README_FILE) return;
  if (STANDARD_METADATA_FILES.has(file.toLowerCase())) return;
  throw new Error(`Packed file ${file} is not allowed by the publish contents contract.`);
}

function isForbiddenPackedFile(file: string): boolean {
  if (file.startsWith(SRC_PREFIX) || file.startsWith(VENDOR_PREFIX)) return true;
  return path.basename(file) === TENDER_TARBALL_FILE;
}

async function assertCleanInstall(input: {
  installDirectory: string;
  tarballPath: string;
}): Promise<void> {
  await writeCleanProjectManifest(input.installDirectory);
  await installPackedTarball(input);
  await assertTenderSdkAbsent(input.installDirectory);
  await importPackedEntrypoints(input.installDirectory);
}

async function writeCleanProjectManifest(installDirectory: string): Promise<void> {
  const manifest = { name: CLEAN_PROJECT_NAME, private: true, type: "module" };
  const manifestPath = path.join(installDirectory, PACKAGE_JSON_FILE);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function installPackedTarball(input: {
  installDirectory: string;
  tarballPath: string;
}): Promise<void> {
  await runCommand(
    "pnpm",
    ["add", "--ignore-scripts", "--config.auto-install-peers=false", input.tarballPath],
    input.installDirectory,
  );
}

async function assertTenderSdkAbsent(installDirectory: string): Promise<void> {
  const tenderPath = path.join(installDirectory, NODE_MODULES_TENDER_PATH);
  try {
    await access(tenderPath);
    throw new Error(`${TENDER_PACKAGE_NAME} unexpectedly exists at ${tenderPath}.`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

async function importPackedEntrypoints(installDirectory: string): Promise<void> {
  await runCommand("node", ["--input-type=module", "--eval", importScript()], installDirectory);
}

function importScript(): string {
  return `const specifiers = ${JSON.stringify(PACKAGE_IMPORTS)};
for (const specifier of specifiers) {
  try {
    await import(specifier);
  } catch (error) {
    throw new Error(\`Import failed for \${specifier}: \${error.message}\`);
  }
}`;
}

async function runCommand(
  command: string,
  args: readonly string[],
  cwd = process.cwd(),
): Promise<CommandResult> {
  try {
    const result = await execFile(command, [...args], { cwd });
    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    throw commandError({ command, args, cwd, error });
  }
}

function commandError(input: CommandFailureInput): Error {
  const result = input.error as Partial<CommandResult> & { message?: string };
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  const details = output || result.message || "unknown failure";
  return new Error(
    `Command failed in ${input.cwd}: ${input.command} ${input.args.join(" ")}\n${details}`,
  );
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
