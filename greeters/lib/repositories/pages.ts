import { prisma } from "@/lib/db/prisma";

import { type PageStatus, type Prisma } from "@prisma/client";

type ListPagesInput = {
  locale?: string;
  status?: PageStatus;
  skip?: number;
  limit?: number;
};

export async function listPages(input: ListPagesInput = {}) {
  const where: Prisma.PageWhereInput = {
    ...(input.locale ? { locale: input.locale } : {}),
    ...(input.status ? { status: input.status } : {}),
  };

  return prisma.page.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    skip: input.skip ?? 0,
    take: input.limit ?? 100,
  });
}

export async function listPublishedPages(limit = 1000, locale?: string) {
  return prisma.page.findMany({
    where: {
      status: "PUBLISHED",
      ...(locale ? { locale } : {}),
    },
    orderBy: [{ menuOrder: "asc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function findPageById(id: string) {
  return prisma.page.findUnique({ where: { id } });
}

export async function findPageBySlug(slug: string, locale: string) {
  return prisma.page.findUnique({
    where: {
      locale_slug: {
        locale,
        slug,
      },
    },
  });
}

export async function listPagesByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  return prisma.page.findMany({
    where: { id: { in: ids } },
  });
}

export async function createPageRecord(data: Prisma.PageUncheckedCreateInput) {
  return prisma.page.create({ data });
}

export async function updatePageRecord(id: string, data: Prisma.PageUncheckedUpdateInput) {
  return prisma.page.update({
    where: { id },
    data,
  });
}

export async function deletePageRecord(id: string) {
  return prisma.page.delete({ where: { id } });
}

export async function countPagesByStatus() {
  const grouped = await prisma.page.groupBy({
    by: ["status", "locale"],
    _count: { _all: true },
  });

  return grouped.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[`${entry.locale}:${entry.status}`] = entry._count._all;
    return accumulator;
  }, {});
}