import { defineConfig } from "tsdown";

// @carte/orders-admin — native React admin built to dist/.
//
// Unbundle mode emits a 1:1 file mapping into dist/, preserving the module
// structure the runtime depends on: src/index.ts re-exports from
// "./admin/App.js" and "./admin/index.js", which only resolve when those
// files exist as siblings in dist/admin/. emdash (peer) and react/react-dom
// (host-provided runtime deps) stay external — node_modules is never inlined
// in unbundle mode.
export default defineConfig({
  entry: ["src/index.ts", "src/admin/index.tsx"],
  unbundle: true,
  dts: true,
  format: "esm",
});
