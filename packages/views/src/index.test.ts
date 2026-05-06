import { describe, expect, it } from "vitest";

import * as views from "./index.js";

describe("@carte/views package surface", () => {
  it("exports the placeholder MenuItem shape", () => {
    expect(views.MenuItem).toBeDefined();
    expect(typeof views.MenuItem).toBe("function");
  });

  it("ships no EmDash plugin manifest", () => {
    // Peer-dep library, not a plugin. There must be no `definePlugin`
    // factory exported from this package — its consumers wire it into
    // their own Astro/React storefront.
    expect((views as Record<string, unknown>)["default"]).toBeUndefined();
  });
});
