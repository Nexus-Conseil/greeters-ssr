import { prisma } from "@/lib/db/prisma";

import { type Prisma } from "@prisma/client";

export async function createPageEditRecord(data: Prisma.PageEditUncheckedCreateInput) {
  return prisma.pageEdit.create({ data });
}

export async function listPageEditsByPageId(pageId: string, limit = 20) {
  return prisma.pageEdit.findMany({
    where: { pageId },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

export async function deletePageEditsByPageId(pageId: string) {
  return prisma.pageEdit.deleteMany({ where: { pageId } });
}