import {
  createTenderClientFromContext,
  type TenderClient,
  type TenderContextLike,
} from "@tenderpay/sdk";
import type { RouteContext } from "emdash";

// Shared Tender client construction for the checkout, refund, and return routes.
// `createTenderClientFromContext` owns token sourcing, `ctx.http.fetch`
// injection, base-URL resolution, and boundary validation — the routes no
// longer hand-derive any of it.

interface RuntimeSettings {
  settings?: {
    tenderBaseUrl?: string;
    tenderPluginToken?: string;
  };
}

/**
 * Narrow the route context's plugin settings to the two values every Tender
 * consumer stores. Throws at the boundary when either is absent so a
 * misconfigured site fails with a clear message instead of an opaque later
 * request error.
 */
export const tenderConsumerSettings = (
  ctx: RouteContext,
): { tenderBaseUrl: string; tenderPluginToken: string } => {
  const settings = (ctx as RouteContext & RuntimeSettings).settings;
  const tenderBaseUrl = settings?.tenderBaseUrl;
  const tenderPluginToken = settings?.tenderPluginToken;
  if (!tenderBaseUrl || !tenderPluginToken) {
    throw new Error("Tender requires base URL and plugin token settings.");
  }

  return { tenderBaseUrl, tenderPluginToken };
};

export const tenderClientFromContext = (ctx: RouteContext): TenderClient =>
  // EmDash narrows `http.fetch` to `(url: string, …)` while the SDK's
  // duck-typed `TenderContextLike` wants the wider `typeof fetch`. The SDK only
  // ever calls it with string URLs, so the shapes are runtime-compatible — a
  // single narrowing assertion bridges the parameter-variance gap (mirrors the
  // refund route's documented client cast) rather than widening emdash's type.
  createTenderClientFromContext(ctx as unknown as TenderContextLike, tenderConsumerSettings(ctx));
