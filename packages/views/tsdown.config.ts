import { defineConfig } from "tsdown";

// @carte/views — peer-dep Astro component library built to dist/.
//
// Two output kinds live side by side in dist/:
//   1. Compiled TS modules (format, styles, types, hours, schema, safe-json,
//      safe-redirect, index) emitted in unbundle mode so each maps 1:1 into
//      dist/ at its original path.
//   2. The raw .astro components, copied verbatim — Astro source is NOT
//      compiled at library-build time; the consumer's own Astro toolchain
//      compiles it.
//
// The .astro files import the TS modules with literal ".js" specifiers
// (e.g. import { formatCurrency } from "../format.js"). tsdown does NOT rewrite
// those copied files, so the compiled TS MUST emit ".js" (not ".mjs") to
// satisfy them. fixedExtension:false + "type":"module" yields ".js" output.
//
// Every non-test src/*.ts is listed as an entry because hours.ts and schema.ts
// are imported only by .astro files (never from index.ts); unbundle only emits
// files reachable from an entry, so they must be entries to land in dist/.
export default defineConfig({
  entry: [
    "src/index.ts",
    "src/format.ts",
    "src/styles.ts",
    "src/types.ts",
    "src/hours.ts",
    "src/schema.ts",
    "src/safe-json.ts",
    "src/safe-redirect.ts",
  ],
  unbundle: true,
  dts: true,
  format: "esm",
  fixedExtension: false,
  copy: [{ from: "src/components", to: "dist" }],
});
