import { describe, expect, it } from "vitest";

import type { RouteContext } from "emdash";

import { NETWORK_ALLOWED_HOSTS } from "./manifest-constants.js";

const STRIPE_API_URL = "https://api.stripe.com/v1/checkout/sessions";

const stripeFetchProbeHandler = async (ctx: RouteContext): Promise<Response> => {
  if (ctx.http === undefined) {
    throw new Error("ctx.http is required for the Stripe allowlist probe.");
  }
  return ctx.http.fetch(STRIPE_API_URL);
};

const createHostRestrictedContext = (allowedHosts: readonly string[]): RouteContext =>
  ({
    http: {
      async fetch(url: string): Promise<Response> {
        const hostname = new URL(url).hostname;
        if (!allowedHosts.includes(hostname)) {
          throw new Error(`Host "${hostname}" is not present in allowedHosts.`);
        }
        return new Response(null, { status: 204 });
      },
    },
  }) as unknown as RouteContext;

describe("@carte/orders-backend Workers network allowlist", () => {
  it("rejects handler ctx.http.fetch calls to api.stripe.com", async () => {
    const ctx = createHostRestrictedContext(NETWORK_ALLOWED_HOSTS);

    await expect(stripeFetchProbeHandler(ctx)).rejects.toThrow(/api\.stripe\.com|allowedHosts/);
  });
});
