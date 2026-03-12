import { prisma } from "@/lib/db/prisma";

import { type Prisma } from "@prisma/client";

export async function listDocuments(input: Prisma.DocumentFindManyArgs = {}) {
  return prisma.document.findMany({
    orderBy: [{ createdAt: "desc" }],
    ...input,
  });
}

export async function findDocumentById(id: string) {
  return prisma.document.findUnique({ where: { id } });
}

export async function createDocumentRecord(data: Prisma.DocumentUncheckedCreateInput) {
  return prisma.document.create({ data });
}

export async function updateDocumentRecord(id: string, data: Prisma.DocumentUncheckedUpdateInput) {
  return prisma.document.update({ where: { id }, data });
}

export async function deleteDocumentRecord(id: string) {
  return prisma.document.delete({ where: { id } });
}