import { prisma } from "@/lib/db/prisma";

import { type Prisma } from "@prisma/client";

export const MAIN_MENU_ID = "main_menu";

export async function getMainMenuRecord() {
  return prisma.menu.findUnique({ where: { id: MAIN_MENU_ID } });
}

export async function saveMainMenuRecord(items: Prisma.InputJsonValue, updatedBy?: string | null) {
  return prisma.menu.upsert({
    where: { id: MAIN_MENU_ID },
    update: {
      items,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date(),
    },
    create: {
      id: MAIN_MENU_ID,
      items,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date(),
    },
  });
}