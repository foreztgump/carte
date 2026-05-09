import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { safeJsonForScript } from "./safe-json.js";

const componentRoot = join(__dirname, "components");
const scriptEmbeddingComponents = ["OrderingCheckout", "RestaurantHero", "MenuDisplay"];

describe("safeJsonForScript", () => {
  it("escapes </script> so payloads cannot break out of <script> tags", () => {
    const malicious = { name: "</script><script>alert(1)</script>" };

    const escaped = safeJsonForScript(malicious);

    expect(escaped).not.toMatch(/<\/script/i);
    expect(escaped).toContain("<\\/script");
  });

  it("escapes </style> alongside </script>", () => {
    const malicious = { name: "</style><x>" };

    expect(safeJsonForScript(malicious)).toContain("<\\/style");
  });

  it("escapes U+2028 and U+2029 line terminators", () => {
    const escaped = safeJsonForScript({ note: "line\u2028break\u2029end" });

    expect(escaped).toContain("\\u2028");
    expect(escaped).toContain("\\u2029");
    expect(escaped).not.toContain("\u2028");
    expect(escaped).not.toContain("\u2029");
  });

  it("preserves a round-trip parse for safe payloads", () => {
    const value = { items: [{ id: "x", name: "Plain & safe" }] };

    expect(JSON.parse(safeJsonForScript(value))).toEqual(value);
  });
});

describe("components embedding JSON in <script> tags", () => {
  it.each(scriptEmbeddingComponents)(
    "%s imports safeJsonForScript and avoids raw JSON.stringify for script payloads",
    (componentName) => {
      const source = readFileSync(join(componentRoot, `${componentName}.astro`), "utf8");

      expect(source).toContain("safeJsonForScript");
      expect(source).not.toMatch(/set:html=\{JSON\.stringify/);
    },
  );
});
