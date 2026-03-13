import { prisma } from "@/lib/db/prisma";

type PasswordResetCreateInput = {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
};

export async function createPasswordResetRecord(input: PasswordResetCreateInput) {
  return prisma.passwordReset.create({
    data: input,
  });
}

export async function findPasswordResetByTokenHash(tokenHash: string) {
  return prisma.passwordReset.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
}

export async function deletePasswordResetByTokenHash(tokenHash: string) {
  return prisma.passwordReset.deleteMany({
    where: { tokenHash },
  });
}

export async function deletePasswordResetsForUser(userId: string) {
  return prisma.passwordReset.deleteMany({
    where: { userId },
  });
}