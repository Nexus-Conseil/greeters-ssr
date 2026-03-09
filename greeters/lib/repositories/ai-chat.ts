import { AiChatRole, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function createAiChatSessionRecord(data: Prisma.AiChatSessionUncheckedCreateInput) {
  return prisma.aiChatSession.create({ data });
}

export async function updateAiChatSessionRecord(id: string, data: Prisma.AiChatSessionUncheckedUpdateInput) {
  return prisma.aiChatSession.update({
    where: { id },
    data,
  });
}

export async function findAiChatSessionById(id: string) {
  return prisma.aiChatSession.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });
}

export async function createAiChatMessageRecord(data: Prisma.AiChatMessageUncheckedCreateInput) {
  return prisma.aiChatMessage.create({ data });
}

export { AiChatRole };