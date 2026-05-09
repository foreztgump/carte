// Validate a checkout redirect URL against an allowlist of known-good
// hosts. Use on the host page after a checkout form POST returns a
// redirect URL — never trust an arbitrary URL from the backend.
//
// Default allowlist: Stripe Checkout. Pass additional hosts (exact
// match, no wildcards) when integrating with other PCI-scoped checkout
// providers.

const DEFAULT_ALLOWED_HOSTS: readonly string[] = ["checkout.stripe.com"];
const ALLOWED_PROTOCOL = "https:";

const parsedUrlFor = (candidate: string): URL | null => {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
};

export const isAllowedCheckoutRedirect = (
  candidate: string,
  additionalHosts: readonly string[] = [],
): boolean => {
  const parsed = parsedUrlFor(candidate);
  if (!parsed) return false;
  if (parsed.protocol !== ALLOWED_PROTOCOL) return false;
  const allowedHosts = new Set([...DEFAULT_ALLOWED_HOSTS, ...additionalHosts]);
  return allowedHosts.has(parsed.host);
};

export const safeCheckoutRedirect = (
  candidate: string,
  additionalHosts: readonly string[] = [],
): string | null => (isAllowedCheckoutRedirect(candidate, additionalHosts) ? candidate : null);
