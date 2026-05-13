import { describe, expect, it } from "vitest";

import type { RouteContext } from "emdash";

import { NETWORK_ALLOWED_HOSTS } from "./manifest-constants.js";
import { tenderPaymentSucceededHook } from "./index.js";

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

  it("dedupes duplicate Tender payment events before scheduling order updates", async () => {
    const processedKeys = new Set<string>();
    const updates: Array<{ collection: string; id: string; value: unknown }> = [];
    const waitUntilTasks: Promise<unknown>[] = [];
    const ctx = {
      kv: {
        async get(key: string) {
          return processedKeys.has(key) ? "processed" : null;
        },
        async set(key: string) {
          processedKeys.add(key);
        },
      },
      content: {
        async update(collection: string, id: string, value: unknown) {
          updates.push({ collection, id, value });
        },
      },
      waitUntil(task: Promise<unknown>) {
        waitUntilTasks.push(task);
      },
    } as unknown as RouteContext;
    const event = {
      id: "evt_workers_duplicate",
      metadata: { carte_order_id: "order_workers_123" },
    };

    await tenderPaymentSucceededHook(event, ctx);
    await tenderPaymentSucceededHook(event, ctx);
    await Promise.all(waitUntilTasks);

    expect(waitUntilTasks).toHaveLength(1);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      collection: "carte_orders",
      id: "order_workers_123",
      value: { status: "paid" },
    });
  });
});
