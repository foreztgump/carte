import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MANIFEST_PATH = resolve(import.meta.dirname, "../emdash-plugin.jsonc");

const manifestText = (): string => readFileSync(MANIFEST_PATH, "utf8");

describe("@carte/orders-backend sandboxed manifest", () => {
  it("declares the orders-backend trust contract outside source", () => {
    const manifest = manifestText();

    expect(manifest).toContain('"slug": "carte-orders-backend"');
    expect(manifest).toContain('"publisher": "did:plc:tenderfamilyexampleplaceholder"');
    expect(manifest).toContain(
      '"capabilities": ["content:read", "content:write", "network:request:unrestricted"]',
    );
  });

  it("drops the static allowlist now the Tender base URL is operator-configured (PRO-912)", () => {
    const manifest = manifestText();

    expect(manifest).not.toContain('"allowedHosts"');
    expect(manifest).not.toContain("license.carteplugin.dev");
  });

  it("keeps Stripe hosts out of the manifest", () => {
    const manifest = manifestText();

    expect(manifest).not.toContain("api.stripe.com");
    expect(manifest).not.toContain("checkout.stripe.com");
  });

  it("declares the carte_orders collection with status/orderType/email/createdAt indexes", () => {
    const manifest = manifestText();

    expect(manifest).toContain('"carte_orders"');
    expect(manifest).toContain('"indexes": ["status", "orderType", "email", "createdAt"]');
    expect(manifest).toContain('"uniqueIndexes": ["orderNumber"]');
  });
});
