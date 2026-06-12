import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

// Regression guard for the LOCKED capability-name divergence fix
// (VERIFIED-PLATFORM-0.18-carte.md §8). sandbox-workerd@0.1.6's bridge
// enforces DEPRECATED capability names (read:content) while emdash 0.18 +
// plugin-cli 0.5.1 require CANONICAL names (content:read). The committed
// `pnpm patch` teaches requireCapability to accept BOTH forms so that
// in-sandbox ctx.content / ctx.media round-trips succeed with canonical
// manifests. Manifests MUST stay canonical; this patch is the only bridge.
const repoRoot = new URL("../../", import.meta.url);
const patchFile = new URL("patches/@emdash-cms__sandbox-workerd@0.1.6.patch", repoRoot);
const rootPackageJson = new URL("package.json", repoRoot);

const LEGACY_TO_CANONICAL: ReadonlyArray<readonly [string, string]> = [
  ["read:content", "content:read"],
  ["write:content", "content:write"],
  ["read:media", "media:read"],
  ["write:media", "media:write"],
  ["read:users", "users:read"],
  ["network:fetch", "network:request"],
];

describe("sandbox-workerd capability-name alias patch", () => {
  it("is wired through pnpm.patchedDependencies in the root package.json", async () => {
    const pkg = JSON.parse(await readFile(rootPackageJson, "utf8"));

    expect(pkg.pnpm?.patchedDependencies?.["@emdash-cms/sandbox-workerd@0.1.6"]).toBe(
      "patches/@emdash-cms__sandbox-workerd@0.1.6.patch",
    );
  });

  it("maps every deprecated bridge capability to its canonical form", async () => {
    const patch = await readFile(patchFile, "utf8");

    for (const [legacy, canonical] of LEGACY_TO_CANONICAL) {
      expect(patch).toContain(`"${legacy}": "${canonical}"`);
    }
  });

  it("accepts the canonical alias inside requireCapability without dropping the original check", async () => {
    const patch = await readFile(patchFile, "utf8");

    expect(patch).toContain("CAPABILITY_ALIASES[capability]");
    expect(patch).toContain("if (opts.capabilities.includes(capability)) return;");
    expect(patch).toContain("if (canonical && opts.capabilities.includes(canonical)) return;");
  });
});
