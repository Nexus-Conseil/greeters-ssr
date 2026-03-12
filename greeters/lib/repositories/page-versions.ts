import { prisma } from "@/lib/db/prisma";

import { type PageStatus, type Prisma } from "@prisma/client";

export async function createPageVersionRecord(data: Prisma.PageVersionUncheckedCreateInput) {
  return prisma.pageVersion.create({ data });
}

export async function findPageVersionById(id: string) {
  return prisma.pageVersion.findUnique({ where: { id } });
}

export async function findPageVersion(pageId: string, versionNumber: number) {
  return prisma.pageVersion.findUnique({
    where: {
      pageId_versionNumber: {
        pageId,
        versionNumber,
      },
    },
  });
}

export async function listPendingPageVersions() {
  return prisma.pageVersion.findMany({
    where: { status: "PENDING" },
    orderBy: [{ createdAt: "desc" }],
    take: 1000,
  });
}

export async function listPageVersions(pageId: string, limit = 5) {
  return prisma.pageVersion.findMany({
    where: { pageId },
    orderBy: [{ versionNumber: "desc" }],
    take: limit,
  });
}

export async function listVersionsForPublishedStates(pageIds: string[], publishedVersions: number[]) {
  if (pageIds.length === 0 || publishedVersions.length === 0) {
    return [];
  }

  return prisma.pageVersion.findMany({
    where: {
      pageId: { in: pageIds },
      versionNumber: { in: publishedVersions },
    },
  });
}

export async function updatePageVersionStatus(
  id: string,
  data: {
    status: PageStatus;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    rejectionReason?: string | null;
  },
) {
  return prisma.pageVersion.update({
    where: { id },
    data,
  });
}

export async function deleteVersionsForPage(pageId: string) {
  return prisma.pageVersion.deleteMany({ where: { pageId } });
}