const TOKEN_ALGORITHM = "HS256";
const HMAC_ALGORITHM = { name: "HMAC", hash: "SHA-256" };

export interface ReservationTokenPayload {
  reservationId: string;
  nonce: string;
}

interface SignedTokenEnvelope extends ReservationTokenPayload {
  alg: typeof TOKEN_ALGORITHM;
  sig: string;
}

export async function createReservationToken(
  payload: ReservationTokenPayload,
  secret: string,
): Promise<string> {
  const signature = await signPayload(payload, secret);
  return encodeJson({ ...payload, alg: TOKEN_ALGORITHM, sig: signature });
}

export async function verifyReservationToken(
  token: string,
  secret: string,
): Promise<ReservationTokenPayload | null> {
  const envelope = decodeJson<SignedTokenEnvelope>(token);
  if (envelope === null || envelope.alg !== TOKEN_ALGORITHM) return null;
  const expectedSignature = await signPayload(envelope, secret);
  if (!timingSafeEqual(envelope.sig, expectedSignature)) return null;
  return { reservationId: envelope.reservationId, nonce: envelope.nonce };
}

async function signPayload(payload: ReservationTokenPayload, secret: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    HMAC_ALGORITHM,
    false,
    ["sign"],
  );
  const data = new TextEncoder().encode(`${payload.reservationId}:${payload.nonce}`);
  const signature = await globalThis.crypto.subtle.sign(HMAC_ALGORITHM.name, key, data);
  return toBase64Url(new Uint8Array(signature));
}

function encodeJson(value: SignedTokenEnvelope): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson<T>(token: string): T | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(token));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
