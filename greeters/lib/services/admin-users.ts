import { type UserRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/repositories/users";

export class AdminUsersServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminUsersServiceError";
  }
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listAdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return users.map(toPublicUser);
}

export async function createAdminUser(input: { name: string; email: string; password: string; role: UserRole }, createdBy?: string) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!name || !email || !password) {
    throw new AdminUsersServiceError(400, "Nom, email et mot de passe sont obligatoires.");
  }

  if (password.length < 10) {
    throw new AdminUsersServiceError(400, "Le mot de passe doit contenir au moins 10 caractères.");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AdminUsersServiceError(409, "Un utilisateur avec cet email existe déjà.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: input.role,
      createdBy,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return toPublicUser(user);
}

export async function updateAdminUserRole(userId: string, role: UserRole) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return toPublicUser(user);
}

export async function deleteAdminUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
  return { success: true };
}