import { prisma } from "@/lib/db/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function listUsersByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  return prisma.user.findMany({
    where: { id: { in: ids } },
  });
}