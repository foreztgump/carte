import { describe, expect, it } from "vitest";
import { describeTenderPackage } from "@tenderpay/sdk";

describe("@tenderpay/sdk workspace link", () => {
  it("resolves the published Tender SDK package", () => {
    expect(describeTenderPackage().name).toBe("@tenderpay/sdk");
  });
});
