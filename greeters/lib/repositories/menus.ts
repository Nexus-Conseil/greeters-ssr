import { prisma } from "@/lib/db/prisma";
import { getDumpMainMenu, isDumpFallbackEnabled } from "@/lib/data/dump-fallback";

import { type Prisma } from "@prisma/client";

export const MAIN_MENU_ID = "main_menu";

export function getMainMenuId(locale: string) {
  return `${MAIN_MENU_ID}:${locale}`;
}

export async function getMainMenuRecord(locale: string) {
  if (isDumpFallbackEnabled()) {
    return getDumpMainMenu(getMainMenuId(locale));
  }

  return prisma.menu.findUnique({ where: { id: getMainMenuId(locale) } });
}

export async function saveMainMenuRecord(locale: string, items: Prisma.InputJsonValue, updatedBy?: string | null) {
  return prisma.menu.upsert({
    where: { id: getMainMenuId(locale) },
    update: {
      items,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date(),
    },
    create: {
      id: getMainMenuId(locale),
      items,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date(),
    },
  });
}