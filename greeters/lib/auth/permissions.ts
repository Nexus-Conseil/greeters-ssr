import { UserRole } from "@prisma/client";

import { getAuthenticatedSession, type AuthUser } from "./session";

export class AuthError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const ADMIN_ROLES: readonly UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
const EDITOR_ROLES: readonly UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR];

export function isAdminRole(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export function isEditorRole(role: UserRole) {
  return EDITOR_ROLES.includes(role);
}

export function requireRole(user: AuthUser, roles: readonly UserRole[], message: string) {
  if (!roles.includes(user.role)) {
    throw new AuthError(403, message);
  }

  return user;
}

export async function requireApiUser() {
  const session = await getAuthenticatedSession();

  if (!session) {
    throw new AuthError(401, "Authentification requise.");
  }

  return session.user;
}

export async function requireEditorApiUser() {
  return requireRole(await requireApiUser(), EDITOR_ROLES, "Accès éditeur requis.");
}

export async function requireAdminApiUser() {
  return requireRole(await requireApiUser(), ADMIN_ROLES, "Accès administrateur requis.");
}