import type { RouteContext } from "emdash";

// Migration aid: if a legacy Stripe secret lingers in plugin settings, surface
// a one-time Block Kit notice nudging operators to move it to @tenderpay/stripe.
// Never echoes the secret value. Shown at most once (KV-guarded).

const STALE_STRIPE_WARNING_KEY = "migration:stripe-secret-warning-shown";
const STALE_STRIPE_WARNING_TTL_SECONDS = 31_536_000;

interface RuntimeSettings {
  settings?: {
    stripeSecretKey?: unknown;
  };
}

interface RuntimeKv {
  kv?: {
    get<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: unknown, options?: { expirationTtl: number }): Promise<void>;
  };
}

export interface BlockKitSection {
  type: "section";
  label: string;
  text: string;
}

export const createStaleStripeSettingsWarning = async (
  ctx: RouteContext,
): Promise<BlockKitSection | null> => {
  const runtime = ctx as RouteContext & RuntimeSettings & RuntimeKv;
  const hasLegacySecret = typeof runtime.settings?.stripeSecretKey === "string";
  if (!hasLegacySecret || runtime.kv === undefined) return null;

  try {
    const alreadyShown = await runtime.kv.get<string>(STALE_STRIPE_WARNING_KEY);
    if (alreadyShown === "shown") return null;

    await runtime.kv.set(STALE_STRIPE_WARNING_KEY, "shown", {
      expirationTtl: STALE_STRIPE_WARNING_TTL_SECONDS,
    });
  } catch {
    return null;
  }

  return {
    type: "section",
    label: "Tender migration notice",
    text: "Move the legacy Stripe secret to @tenderpay/stripe settings, then remove it from Carte orders backend settings.",
  };
};
