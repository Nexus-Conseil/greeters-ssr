export const SESSION_COOKIE_NAME = "greeters_session";
export const SESSION_DURATION_DAYS = 7;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SessionCookiePayload = {
  sessionToken: string;
  userId: string;
  exp: number;
};

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getSigningKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET est manquant.");
  }

  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export async function signSessionPayload(payload: SessionCookiePayload) {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionPayload(value: string) {
  const [body, signature] = value.split(".");

  if (!body || !signature) {
    return null;
  }

  const key = await getSigningKey();
  const valid = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(signature), encoder.encode(body));

  if (!valid) {
    return null;
  }

  const payload = JSON.parse(decoder.decode(base64UrlToBytes(body))) as SessionCookiePayload;

  if (!payload.exp || payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return payload;
}