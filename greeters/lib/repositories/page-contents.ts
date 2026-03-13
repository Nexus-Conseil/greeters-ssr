import { prisma } from "@/lib/db/prisma";

import { type Prisma } from "@prisma/client";

export async function findPageContentByPageId(pageId: string) {
  return prisma.pageContent.findUnique({ where: { pageId } });
}

export async function upsertPageContentRecord(pageId: string, content: Prisma.InputJsonValue) {
  return prisma.pageContent.upsert({
    where: { pageId },
    update: {
      content,
      updatedAt: new Date(),
    },
    create: {
      pageId,
      content,
    },
  });
}

export async function deletePageContentByPageId(pageId: string) {
  return prisma.pageContent.deleteMany({ where: { pageId } });
}