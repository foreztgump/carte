import type { RouteContext } from "emdash";

// Test-only context builders for orders-backend route modules. Each returns a
// `RouteContext` plus recorded side effects. Base plugin-context fields are
// always present so the literal casts to `RouteContext` with sufficient
// structural overlap — no widening conversion bridge required.

const TEST_SITE_URL = "https://example.test";

const basePluginFields = () => ({
  plugin: { id: "carte-orders-backend", version: "0.1.0" },
  ["storage"]: {},
  log: {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  },
  site: { name: "Carte Test", url: TEST_SITE_URL, locale: "en" },
  url: (path: string) => new URL(path, TEST_SITE_URL).toString(),
});

type BasePluginFields = ReturnType<typeof basePluginFields>;

const asRouteContext = <T extends object>(fields: T): RouteContext =>
  ({ ...basePluginFields(), ...fields }) as BasePluginFields & T & RouteContext;

export interface CheckoutContextHandle {
  ctx: RouteContext;
  kvWrites: Array<{ key: string; options?: { expirationTtl: number } }>;
  subrequests: string[];
}

export const tenderCheckoutContext = (): CheckoutContextHandle => {
  const subrequests: string[] = [];
  const kvWrites: Array<{ key: string; options?: { expirationTtl: number } }> = [];
  const ctx = asRouteContext({
    input: {
      cartId: "cart_123",
      orderId: "order_123",
      customerEmail: "guest@example.com",
      successUrl: "https://restaurant.example/orders/success",
      cancelUrl: "https://restaurant.example/orders/cancel",
      lineItems: [{ name: "Margherita Pizza", unitAmount: 1295, quantity: 2 }],
    },
    request: new Request("https://example.test/checkout"),
    requestMeta: { ip: "203.0.113.44", userAgent: null, referer: null, geo: null },
    kv: {
      async get() {
        subrequests.push("kv.get");
        return null;
      },
      async set(key: string, _value: unknown, options?: { expirationTtl: number }) {
        subrequests.push("kv.set");
        if (options) kvWrites.push({ key, options });
      },
    },
    http: {
      async fetch(url: string, init: RequestInit) {
        subrequests.push("http.fetch");
        return new Response(JSON.stringify({ url, init }));
      },
    },
    settings: {
      tenderBaseUrl: "https://restaurant.example",
      tenderPluginToken: "tender_plugin_token",
      currency: "usd",
    },
  });
  return { ctx, kvWrites, subrequests };
};

export interface RefundContextOptions {
  input?: { orderId: string; transactionId: string; amount?: number; reason?: string };
  update?: (collection: string, id: string, value: unknown) => Promise<void>;
}

export interface RefundContextHandle {
  ctx: RouteContext;
  updates: Array<{ collection: string; id: string; value: unknown }>;
  waitUntilTasks: Promise<unknown>[];
}

export const tenderRefundContext = (options: RefundContextOptions = {}): RefundContextHandle => {
  const updates: Array<{ collection: string; id: string; value: unknown }> = [];
  const waitUntilTasks: Promise<unknown>[] = [];
  const ctx = asRouteContext({
    input: options.input ?? {
      orderId: "order_123",
      transactionId: "txn_123",
      amount: 1295,
      reason: "Customer changed their mind",
    },
    auth: { scopes: ["admin"] },
    http: {
      async fetch() {
        throw new Error("Refund route must use Tender SDK instead of direct fetch.");
      },
    },
    content: {
      async update(collection: string, id: string, value: unknown) {
        if (options.update) return options.update(collection, id, value);
        updates.push({ collection, id, value });
      },
    },
    settings: {
      tenderBaseUrl: "https://restaurant.example",
      tenderPluginToken: "tender_plugin_token",
    },
    waitUntil(task: Promise<unknown>) {
      waitUntilTasks.push(task);
    },
  });
  return { ctx, updates, waitUntilTasks };
};

export interface RateLimitCounters {
  get: number;
  set: number;
  setOptions: Array<Record<string, unknown> | undefined>;
}

export const rateLimitContext = (ip: string | null, counters: RateLimitCounters): RouteContext => {
  const store = new Map<string, unknown>();
  return asRouteContext({
    input: {},
    request: new Request("https://example.test/checkout"),
    requestMeta: { ip, userAgent: null, referer: null, geo: null },
    kv: {
      async get<T>(key: string): Promise<T | null> {
        counters.get += 1;
        return (store.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown, opts?: Record<string, unknown>): Promise<void> {
        counters.set += 1;
        counters.setOptions.push(opts);
        store.set(key, value);
      },
    },
  });
};

export const spoofableRateLimitContext = (store: Map<string, unknown>, xff: string): RouteContext =>
  asRouteContext({
    input: {},
    request: new Request("https://example.test/checkout", {
      headers: { "x-forwarded-for": xff },
    }),
    requestMeta: { ip: null, userAgent: null, referer: null, geo: null },
    kv: {
      async get<T>(key: string): Promise<T | null> {
        return (store.get(key) as T | undefined) ?? null;
      },
      async set(key: string, value: unknown): Promise<void> {
        store.set(key, value);
      },
    },
  });

export interface WarningContextHandle {
  ctx: RouteContext;
  writes: Array<{ key: string; value: unknown; options?: Record<string, unknown> }>;
}

export const staleStripeWarningContext = (): WarningContextHandle => {
  const writes: Array<{ key: string; value: unknown; options?: Record<string, unknown> }> = [];
  const seenKeys = new Set<string>();
  const ctx = asRouteContext({
    settings: { stripeSecretKey: "sk_live_should_never_leak" },
    kv: {
      async get(key: string) {
        return seenKeys.has(key) ? "shown" : null;
      },
      async set(key: string, value: unknown, options?: Record<string, unknown>) {
        seenKeys.add(key);
        writes.push(options === undefined ? { key, value } : { key, value, options });
      },
    },
  });
  return { ctx, writes };
};
