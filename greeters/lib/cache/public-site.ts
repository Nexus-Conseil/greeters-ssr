import { revalidateTag } from "next/cache";

export const PUBLIC_SITE_CACHE_TAGS = {
  pages: "public-pages",
  menu: "public-menu",
  home: "public-home",
} as const;

export async function revalidatePublicSiteCache() {
  revalidateTag(PUBLIC_SITE_CACHE_TAGS.pages, "max");
  revalidateTag(PUBLIC_SITE_CACHE_TAGS.menu, "max");
  revalidateTag(PUBLIC_SITE_CACHE_TAGS.home, "max");
}