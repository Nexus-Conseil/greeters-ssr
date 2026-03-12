import { prisma } from "@/lib/db/prisma";
import { getDumpHomeSectionByType, isDumpFallbackEnabled, listDumpHomeSections } from "@/lib/data/dump-fallback";

import { type Prisma } from "@prisma/client";

export async function listHomeSections() {
  if (isDumpFallbackEnabled()) {
    return listDumpHomeSections();
  }

  return prisma.homeSection.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
  });
}

export async function findHomeSectionByType(sectionType: string) {
  if (isDumpFallbackEnabled()) {
    return getDumpHomeSectionByType(sectionType);
  }

  return prisma.homeSection.findUnique({ where: { sectionType } });
}

export async function upsertHomeSectionRecord(
  sectionType: string,
  data: Pick<Prisma.HomeSectionUncheckedCreateInput, "content" | "items" | "order">,
) {
  return prisma.homeSection.upsert({
    where: { sectionType },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      sectionType,
      ...data,
    },
  });
}