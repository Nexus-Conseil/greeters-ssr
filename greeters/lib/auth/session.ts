import { cookies } from "next/headers";
import type { User } from "@prisma/client";

import { createSessionRecord, deleteExpiredSessions, deleteSessionsByTokenHash, findSessionWithUserByTokenHash } from "@/lib/repositories/sessions";

import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  signSessionPayload,
  verifySessionPayload,
} from "./session-cookie";

const encoder = new TextEncoder();

export type AuthUser = Pick<User, "id" | "email" | "name" | "role" | "createdAt">;

function serializeUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createSessionToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function createSessionForUser(user: User) {
  const sessionToken = createSessionToken();
  const tokenHash = await sha256Hex(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await createSessionRecord({ userId: user.id, tokenHash, expiresAt });

  const cookieValue = await signSessionPayload({
    sessionToken,
    userId: user.id,
    exp: Math.floor(expiresAt.getTime() / 1000),
  });

  return {
    cookieValue,
    expiresAt,
    user: serializeUser(user),
  };
}

export async function setSessionCookie(cookieValue: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, getSessionCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export async function getAuthenticatedSession(cookieValue?: string) {
  const resolvedCookieValue = cookieValue ?? (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!resolvedCookieValue) {
    return null;
  }

  const payload = await verifySessionPayload(resolvedCookieValue);

  if (!payload) {
    return null;
  }

  await deleteExpiredSessions();

  const tokenHash = await sha256Hex(payload.sessionToken);
  const session = await findSessionWithUserByTokenHash(tokenHash);

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: serializeUser(session.user),
  };
}

export async function destroySession(cookieValue?: string) {
  const resolvedCookieValue = cookieValue ?? (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (resolvedCookieValue) {
    const payload = await verifySessionPayload(resolvedCookieValue);

    if (payload) {
      const tokenHash = await sha256Hex(payload.sessionToken);
      await deleteSessionsByTokenHash(tokenHash);
    }
  }

  await clearSessionCookie();
}