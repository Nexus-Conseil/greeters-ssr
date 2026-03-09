import type { Prisma } from "@prisma/client";

import { getMainMenuRecord, saveMainMenuRecord } from "@/lib/repositories/menus";
import { listPublishedPages } from "@/lib/repositories/pages";

export type MenuItem = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  order: number;
  isVisible: boolean;
};

function parseMenuItems(input: unknown): MenuItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      return {
        id: String(candidate.id ?? `menu-item-${index}`),
        label: String(candidate.label ?? "Lien"),
        href: String(candidate.href ?? "/"),
        isExternal: Boolean(candidate.isExternal ?? candidate.is_external ?? false),
        order: Number(candidate.order ?? index),
        isVisible: Boolean(candidate.isVisible ?? candidate.is_visible ?? true),
      } satisfies MenuItem;
    })
    .filter((item): item is MenuItem => item !== null)
    .sort((left, right) => left.order - right.order);
}

export async function getMenu() {
  const menu = await getMainMenuRecord();

  return {
    id: menu?.id ?? "main_menu",
    items: parseMenuItems(menu?.items),
    updatedBy: menu?.updatedBy ?? null,
    updatedAt: menu?.updatedAt?.toISOString() ?? null,
  };
}

export async function updateMenu(items: MenuItem[], updatedBy: string) {
  const payload = items.map((item, index) => ({ ...item, order: item.order ?? index })) as Prisma.InputJsonValue;
  const menu = await saveMainMenuRecord(payload, updatedBy);

  return {
    id: menu.id,
    items: parseMenuItems(menu.items),
    updatedBy: menu.updatedBy,
    updatedAt: menu.updatedAt?.toISOString() ?? null,
  };
}

export async function syncMenuFromPublishedPages(updatedBy: string) {
  const pages = await listPublishedPages();
  const items = pages
    .filter((page) => page.isInMenu)
    .map((page) => ({
      id: page.id,
      label: page.menuLabel || page.title,
      href: page.slug === "/" ? "/" : `/${page.slug}`,
      isExternal: false,
      order: page.menuOrder,
      isVisible: true,
    } satisfies MenuItem));

  return updateMenu(items, updatedBy);
}