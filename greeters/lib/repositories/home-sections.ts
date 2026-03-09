import { prisma } from "@/lib/db/prisma";

import { type Prisma } from "@prisma/client";

export async function listHomeSections() {
  return prisma.homeSection.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
  });
}

export async function findHomeSectionByType(sectionType: string) {
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