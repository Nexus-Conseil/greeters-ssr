import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

import { revalidatePublicSiteCache, PUBLIC_SITE_CACHE_TAGS } from "@/lib/cache/public-site";
import { getMainMenuId, getMainMenuRecord, saveMainMenuRecord } from "@/lib/repositories/menus";
import { listPublishedPages } from "@/lib/repositories/pages";
import { DEFAULT_LOCALE, normalizeLocale, type AppLocale } from "@/lib/i18n/config";

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

const getMenuCached = unstable_cache(
  async (locale: AppLocale = DEFAULT_LOCALE) => {
    const resolvedLocale = normalizeLocale(locale);
    const menu = await getMainMenuRecord(resolvedLocale);
    const menuItems = parseMenuItems(menu?.items);

    if (menuItems.length === 0) {
      const publishedPages = await listPublishedPages(1000, resolvedLocale);

      return {
        id: menu?.id ?? getMainMenuId(resolvedLocale),
        locale: resolvedLocale,
        items: publishedPages
          .filter((page) => page.isInMenu)
          .map((page) => ({
            id: page.id,
            label: page.menuLabel || page.title,
            href: page.slug === "/" ? "/" : `/${page.slug}`,
            isExternal: false,
            order: page.menuOrder,
            isVisible: true,
          }))
          .sort((left, right) => left.order - right.order),
        updatedBy: menu?.updatedBy ?? null,
        updatedAt: menu?.updatedAt?.toISOString() ?? null,
      };
    }

    return {
      id: menu?.id ?? getMainMenuId(resolvedLocale),
      locale: resolvedLocale,
      items: menuItems,
      updatedBy: menu?.updatedBy ?? null,
      updatedAt: menu?.updatedAt?.toISOString() ?? null,
    };
  },
  ["public-menu"],
  {
    revalidate: 300,
    tags: [PUBLIC_SITE_CACHE_TAGS.menu],
  },
);

export const getMenu = cache(async (locale: AppLocale = DEFAULT_LOCALE) => getMenuCached(locale));

export async function updateMenu(items: MenuItem[], updatedBy: string, locale: AppLocale = DEFAULT_LOCALE) {
  const resolvedLocale = normalizeLocale(locale);
  const payload = items.map((item, index) => ({ ...item, order: item.order ?? index })) as Prisma.InputJsonValue;
  const menu = await saveMainMenuRecord(resolvedLocale, payload, updatedBy);
  await revalidatePublicSiteCache();

  return {
    id: menu.id,
    locale: resolvedLocale,
    items: parseMenuItems(menu.items),
    updatedBy: menu.updatedBy,
    updatedAt: menu.updatedAt?.toISOString() ?? null,
  };
}

export async function syncMenuFromPublishedPages(updatedBy: string, locale: AppLocale = DEFAULT_LOCALE) {
  const resolvedLocale = normalizeLocale(locale);
  const pages = await listPublishedPages(1000, resolvedLocale);
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

  return updateMenu(items, updatedBy, resolvedLocale);
}