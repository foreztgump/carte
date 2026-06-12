import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MANIFEST_PATH = resolve(import.meta.dirname, "../emdash-plugin.jsonc");

const manifestText = (): string => readFileSync(MANIFEST_PATH, "utf8");

describe("@carte/reservations sandboxed manifest", () => {
  it("declares the reservations trust contract outside source", () => {
    const manifest = manifestText();

    expect(manifest).toContain('"slug": "carte-reservations"');
    expect(manifest).toContain('"publisher": "did:plc:tenderfamilyexampleplaceholder"');
    expect(manifest).toContain('"capabilities": ["content:read", "content:write", "email:send"]');
    expect(manifest).toContain('"allowedHosts": []');
  });

  it("declares reservation storage including capacity slot uniqueness intent", () => {
    const manifest = manifestText();

    expect(manifest).toContain('"carte_reservations"');
    expect(manifest).toContain('"carte_reservation_blocks"');
    expect(manifest).toContain('"carte_reservation_capacity"');
    expect(manifest).toContain('"indexes": ["slotKey", "date", "slot"]');
    expect(manifest).toContain('"uniqueIndexes": ["slotKey"]');
  });
});
