import { prisma } from "@/lib/db/prisma";

type SessionCreateInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export async function createSessionRecord(input: SessionCreateInput) {
  return prisma.session.create({
    data: input,
  });
}

export async function findSessionWithUserByTokenHash(tokenHash: string) {
  return prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
}

export async function deleteSessionsByTokenHash(tokenHash: string) {
  return prisma.session.deleteMany({
    where: { tokenHash },
  });
}

export async function deleteExpiredSessions(before = new Date()) {
  return prisma.session.deleteMany({
    where: { expiresAt: { lt: before } },
  });
}