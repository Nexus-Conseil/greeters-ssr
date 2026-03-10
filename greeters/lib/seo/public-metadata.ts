import type { Metadata } from "next";

import { getRequestLocale } from "@/lib/i18n/request";
import { buildSeoMetadata } from "@/lib/seo/page-seo";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function getRouteMetadata(slug: string, fallback: { title: string; description: string }): Promise<Metadata> {
  const locale = await getRequestLocale();
  const page = await findPublicPageBySlug(slug, locale).catch(() => null);

  return buildSeoMetadata(page ?? { slug, title: fallback.title, metaDescription: fallback.description }, locale, {
    title: fallback.title,
    description: fallback.description,
    path: slug,
  });
}