import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import * as views from "./index.js";

const packageRoot = join(__dirname, "..");
const sourceRoot = join(__dirname);
const componentRoot = join(sourceRoot, "components");
const componentNames = [
  "CarteShell",
  "DietaryFilter",
  "HoursWidget",
  "MenuDisplay",
  "MenuItem",
  "MenuSection",
  "OrderingCart",
  "OrderingCheckout",
  "ReservationForm",
  "RestaurantHero",
  "RestaurantInfo",
];

const readPackageJson = (): {
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} => JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));

describe("@carte/views Astro shell package", () => {
  it("declares Astro as a peer dependency for consuming storefronts", () => {
    const packageJson = readPackageJson();

    expect(packageJson.peerDependencies?.["astro"]).toBeDefined();
  });

  it("ships as a peer-dep library without an EmDash or Wrangler surface", () => {
    const indexSource = readFileSync(join(sourceRoot, "index.ts"), "utf8");

    expect((views as Record<string, unknown>)["default"]).toBeUndefined();
    expect(indexSource).not.toContain("definePlugin");
    expect(existsSync(join(packageRoot, "wrangler.toml"))).toBe(false);
  });

  it.each(componentNames)(
    "exposes %s with Tailwind defaults and a headless mode",
    (componentName) => {
      const componentPath = join(componentRoot, `${componentName}.astro`);
      const componentSource = readFileSync(componentPath, "utf8");

      expect((views as Record<string, unknown>)[componentName]).toBeDefined();
      expect(componentSource).toContain('variant = "default"');
      expect(componentSource).toContain('variant === "headless"');
      expect(componentSource).toContain("class=");
    },
  );

  it.each(componentNames)("keeps %s data props-only", (componentName) => {
    const componentPath = join(componentRoot, `${componentName}.astro`);
    const componentSource = readFileSync(componentPath, "utf8");

    expect(componentSource).not.toContain("fetch(");
    expect(componentSource).not.toContain("getEmDashCollection");
  });

  it("imports DietaryFilter taxonomy from @carte/core", () => {
    const componentSource = readFileSync(join(componentRoot, "DietaryFilter.astro"), "utf8");

    expect(componentSource).toContain("@carte/core/taxonomy");
  });

  it("exports ordering cart and checkout prop types", () => {
    const typesSource = readFileSync(join(sourceRoot, "types.ts"), "utf8");

    expect(typesSource).toContain("OrderingCartProps");
    expect(typesSource).toContain("OrderingCheckoutProps");
    expect(typesSource).toContain("CarteOrderModifier");
  });

  it("keeps checkout submission on the typed orders-backend checkout route", () => {
    const componentSource = readFileSync(join(componentRoot, "OrderingCheckout.astro"), "utf8");

    expect(componentSource).toContain("data-carte-checkout-form");
    expect(componentSource).toContain("checkoutUrl");
    expect(componentSource).toContain('globalThis["fetch"]');
  });
});
