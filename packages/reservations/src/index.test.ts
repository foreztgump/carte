import { describe, expect, it } from "vitest";

import factory from "./index.js";

const CANONICAL_CAPABILITIES = new Set([
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "network:request",
  "email:send",
  "users:read",
]);

describe("@carte/reservations manifest", () => {
  it("declares the canonical id and version", () => {
    const manifest = factory();
    expect(manifest.id).toBe("carte-reservations");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses canonical capability names only", () => {
    const manifest = factory();
    for (const cap of manifest.capabilities) {
      expect(CANONICAL_CAPABILITIES.has(cap)).toBe(true);
    }
    expect(manifest.capabilities).toEqual(["content:read", "content:write", "email:send"]);
  });

  it("declares reservation collections for ctx.content access", () => {
    const manifest = factory();
    expect(Object.keys(manifest.storage).sort()).toEqual([
      "carte_reservation_blocks",
      "carte_reservations",
    ]);
    expect(manifest.storage.carte_reservations.indexes).toEqual([
      "status",
      "slotStart",
      "guestEmail",
      "confirmationToken",
      "cancelToken",
    ]);
    expect(manifest.storage.carte_reservation_blocks.indexes).toEqual([
      "startsAt",
      "endsAt",
      "scope",
    ]);
  });

  it("declares public reservation and admin wildcard routes", () => {
    const manifest = factory();
    expect(Object.keys(manifest.routes).sort()).toEqual([
      "admin",
      "admin/blocks",
      "admin/settings",
      "cancel-by-token",
      "confirm",
      "submit",
    ]);
    expect(manifest.routes.submit?.public).toBe(true);
    expect(manifest.routes.confirm?.public).toBe(true);
    expect(manifest.routes["cancel-by-token"]?.public).toBe(true);
  });

  it("declares core reservation settings", () => {
    const manifest = factory();
    expect(manifest.admin.settingsSchema).toMatchObject({
      capacityPerSlot: { type: "number", default: 20, min: 1 },
      slotMinutes: { type: "number", default: 30, min: 5 },
      leadMinutes: { type: "number", default: 120, min: 0 },
    });
  });
});
