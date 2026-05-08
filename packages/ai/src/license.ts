const LICENSE_CACHE_SECONDS = 86_400;
const REDACTED = "[redacted]";
const DAY_MS = 24 * 60 * 60 * 1_000;

export const TRIAL_DURATION_MS = 14 * DAY_MS;

export type LicenseStatus = "licensed" | "expired" | "revoked";
export type Access = "licensed" | "trial" | "expired" | "blocked-with-grace";

export interface LicenseRecord {
  status: LicenseStatus;
  plan?: string;
}

export interface TrialRecord {
  startedAt: string;
}

export interface LicenseKv {
  get<T>(key: string): Promise<T | null>;
  put?: (key: string, value: unknown, options?: { expirationTtl?: number }) => Promise<void>;
  set?: (key: string, value: unknown) => Promise<void>;
}

export interface AccessState {
  access: Access;
  trialStartedAt?: string;
  trialEndsAt?: string;
  license?: LicenseRecord;
}

export interface LicenseCheckResult {
  source: "cache" | "network" | "trial-mode";
  state: AccessState;
  banner?: string;
}

interface AccessParams {
  workspaceId: string;
  kv: LicenseKv;
  now: Date;
  license?: LicenseRecord;
}

interface LicenseCheckParams extends AccessParams {
  fetchLicense: () => Promise<LicenseRecord>;
}

const licenseKey = (workspaceId: string) => `license:${workspaceId}`;
const trialKey = (workspaceId: string) => `trial:${workspaceId}`;

export async function checkLicense(params: LicenseCheckParams): Promise<LicenseCheckResult> {
  const cached = await params.kv.get<LicenseRecord>(licenseKey(params.workspaceId));
  if (cached !== null) {
    return cachedLicenseResult(params, cached);
  }
  return fetchAndCacheLicense(params);
}

export async function resolveAccessState(params: AccessParams): Promise<AccessState> {
  if (params.license?.status === "licensed") {
    return { access: "licensed", license: params.license };
  }
  if (params.license !== undefined) {
    return { access: "blocked-with-grace", license: params.license };
  }

  const trial = await getOrStartTrial(params);
  return accessFromTrial(trial, params.now);
}

export function sanitizeTelemetry(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, sanitizeValue(key, value)]),
  );
}

async function cachedLicenseResult(
  params: AccessParams,
  cached: LicenseRecord,
): Promise<LicenseCheckResult> {
  return {
    source: "cache",
    state: await resolveAccessState({ ...params, license: cached }),
    banner: "Using cached license while license.carteplugin.dev is unavailable.",
  };
}

async function fetchAndCacheLicense(params: LicenseCheckParams): Promise<LicenseCheckResult> {
  try {
    const license = await params.fetchLicense();
    await writeKv(params.kv, licenseKey(params.workspaceId), license, LICENSE_CACHE_SECONDS);
    return { source: "network", state: await resolveAccessState({ ...params, license }) };
  } catch {
    return trialModeResult(params);
  }
}

async function trialModeResult(params: AccessParams): Promise<LicenseCheckResult> {
  return {
    source: "trial-mode",
    state: await resolveAccessState(params),
    banner:
      "License server unavailable; continuing in trial mode without locking the restaurant out.",
  };
}

async function getOrStartTrial(params: AccessParams): Promise<TrialRecord> {
  const current = await params.kv.get<TrialRecord>(trialKey(params.workspaceId));
  if (current !== null) {
    return current;
  }

  const trial = { startedAt: params.now.toISOString() };
  await writeKv(params.kv, trialKey(params.workspaceId), trial);
  return trial;
}

function accessFromTrial(trial: TrialRecord, now: Date): AccessState {
  const startedAt = new Date(trial.startedAt).getTime();
  const trialEndsAt = new Date(startedAt + TRIAL_DURATION_MS).toISOString();
  const access = now.getTime() <= startedAt + TRIAL_DURATION_MS ? "trial" : "expired";
  return { access, trialStartedAt: trial.startedAt, trialEndsAt };
}

async function writeKv(
  kv: LicenseKv,
  key: string,
  value: unknown,
  expirationTtl?: number,
): Promise<void> {
  if (kv.put !== undefined) {
    await kv.put(key, value, expirationTtl === undefined ? undefined : { expirationTtl });
    return;
  }
  await kv.set?.(key, value);
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (isPiiKey(key)) {
    return REDACTED;
  }
  if (isRecord(value)) {
    return sanitizeTelemetry(value);
  }
  return value;
}

function isPiiKey(key: string): boolean {
  return ["email", "phone", "name", "notes"].includes(key.toLowerCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
