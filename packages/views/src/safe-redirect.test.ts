import { describe, expect, it } from "vitest";

import * as views from "./index.js";
import { isAllowedCheckoutRedirect, safeCheckoutRedirect } from "./safe-redirect.js";

const STRIPE_HOST = "checkout.stripe.com";

describe("safeCheckoutRedirect", () => {
  it("accepts the canonical Stripe Checkout host over https", () => {
    expect(safeCheckoutRedirect("https://checkout.stripe.com/c/pay/cs_test_abc")).toBe(
      "https://checkout.stripe.com/c/pay/cs_test_abc",
    );
  });

  it("rejects http (non-https) Stripe Checkout URLs", () => {
    expect(safeCheckoutRedirect("http://checkout.stripe.com/c/pay")).toBeNull();
  });

  it("rejects look-alike hosts (homograph / subdomain abuse)", () => {
    expect(safeCheckoutRedirect("https://checkout.stripe.com.evil.example/c")).toBeNull();
    expect(safeCheckoutRedirect("https://evil.checkout.stripe.com.attacker/c")).toBeNull();
  });

  it("rejects javascript:, data:, and protocol-relative URLs", () => {
    expect(safeCheckoutRedirect("javascript:alert(1)")).toBeNull();
    expect(safeCheckoutRedirect("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeCheckoutRedirect("//evil.example/c")).toBeNull();
  });

  it("rejects empty / malformed URLs", () => {
    expect(safeCheckoutRedirect("")).toBeNull();
    expect(safeCheckoutRedirect("   ")).toBeNull();
    expect(safeCheckoutRedirect("not a url")).toBeNull();
  });

  it("supports a caller-supplied additional allowlist host", () => {
    const url = "https://checkout.example.com/session/abc";

    expect(safeCheckoutRedirect(url)).toBeNull();
    expect(safeCheckoutRedirect(url, ["checkout.example.com"])).toBe(url);
  });
});

describe("isAllowedCheckoutRedirect", () => {
  it("returns true only for allowlisted https hosts", () => {
    expect(isAllowedCheckoutRedirect("https://checkout.stripe.com/x")).toBe(true);
    expect(isAllowedCheckoutRedirect(`https://${STRIPE_HOST}.evil/x`)).toBe(false);
    expect(isAllowedCheckoutRedirect("http://checkout.stripe.com/x")).toBe(false);
  });
});

describe("@carte/views package surface", () => {
  it("re-exports safeCheckoutRedirect for host pages to validate redirects", () => {
    expect((views as Record<string, unknown>)["safeCheckoutRedirect"]).toBe(safeCheckoutRedirect);
    expect((views as Record<string, unknown>)["isAllowedCheckoutRedirect"]).toBe(
      isAllowedCheckoutRedirect,
    );
  });
});
