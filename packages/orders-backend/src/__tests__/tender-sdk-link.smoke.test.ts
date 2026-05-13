import { describe, expect, it } from "vitest";
import { describeTenderPackage } from "@tender/sdk";

describe("@tender/sdk workspace link", () => {
  it("resolves the local Tender SDK package", () => {
    expect(describeTenderPackage().name).toBe("@tender/sdk");
  });
});
