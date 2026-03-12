import { prisma } from "@/lib/db/prisma";

import { type PreviewStatus, type Prisma } from "@prisma/client";

export async function createPagePreviewRecord(data: Prisma.PagePreviewUncheckedCreateInput) {
  return prisma.pagePreview.create({ data });
}

export async function findPagePreviewById(id: string) {
  return prisma.pagePreview.findUnique({ where: { id } });
}

export async function listPagePreviewsByPageId(pageId: string) {
  return prisma.pagePreview.findMany({
    where: { pageId },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function updatePagePreviewStatus(id: string, status: PreviewStatus) {
  return prisma.pagePreview.update({
    where: { id },
    data: { status },
  });
}

export async function deletePagePreviewsByPageId(pageId: string) {
  return prisma.pagePreview.deleteMany({ where: { pageId } });
}