export interface AdminIdentity {
  userId: string;
  workspaceId: string;
}

export type IdentityFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export const ADMIN_IDENTITY_UNAVAILABLE_MESSAGE =
  "Carte AI admin identity is unavailable. Sign in to EmDash admin and reload this page.";

const AUTH_ME_ROUTE = "/_emdash/api/auth/me";
const INVALID_ORIGINS = new Set(["", "null"]);

interface AuthMeResponse {
  data?: {
    id?: unknown;
  };
}

export function identityFromElementDataset(element: HTMLElement): AdminIdentity | null {
  const userId = nonEmpty(element.dataset.userId);
  const workspaceId = nonEmpty(element.dataset.workspaceId);
  if (userId === null || workspaceId === null) {
    return null;
  }
  return { userId, workspaceId };
}

export async function resolveAdminIdentity(
  fetcher: IdentityFetcher | undefined = globalThis.fetch?.bind(globalThis),
  origin: string | undefined = globalThis.location?.origin,
): Promise<AdminIdentity | null> {
  const workspaceId = workspaceIdFromOrigin(origin);
  if (fetcher === undefined || workspaceId === null) {
    return null;
  }
  const userId = await fetchCurrentUserId(fetcher);
  return userId === null ? null : { userId, workspaceId };
}

function workspaceIdFromOrigin(origin: string | undefined): string | null {
  const workspaceId = nonEmpty(origin);
  return workspaceId === null || INVALID_ORIGINS.has(workspaceId) ? null : workspaceId;
}

async function fetchCurrentUserId(fetcher: IdentityFetcher): Promise<string | null> {
  try {
    const response = await fetcher(AUTH_ME_ROUTE, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as AuthMeResponse;
    return nonEmpty(payload.data?.id);
  } catch {
    return null;
  }
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
