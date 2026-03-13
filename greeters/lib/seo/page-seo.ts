import type { Metadata } from "next";

import { buildLocaleUrl, DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";
import type { CmsSection, PageInput, PageResponse, SeoImageRecommendation } from "@/lib/services/pages";

export const SITEMAP_CHANGEFREQ_OPTIONS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"] as const;

function normalizePath(slug: string) {
  if (!slug || slug === "/") {
    return "/";
  }

  return slug.startsWith("/") ? slug : `/${slug}`;
}

function createSlugBaseName(slug: string, index: number) {
  const normalized = normalizePath(slug).replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "accueil";
  return `${normalized}-${index + 1}`;
}

export function extractImageRecommendationsFromSections(sections: CmsSection[], slug: string): SeoImageRecommendation[] {
  return sections.flatMap((section) =>
    section.blocks
      .filter((block) => block.type === "image")
      .map((block, index) => ({
        blockId: block.id,
        currentSrc: typeof block.content.src === "string" ? block.content.src : "",
        suggestedFileName: `${createSlugBaseName(slug, index)}.webp`,
        suggestedAlt: typeof block.content.alt === "string" && block.content.alt.trim() ? block.content.alt : `${section.name} — Paris Greeters`,
        suggestedTitle: section.name,
        reason: "Nom de fichier descriptif + alt centré sur l’intention SEO de la page.",
      })),
  );
}

export function buildSeoMetadata(page: Partial<PageInput>, locale: AppLocale, fallback: { title: string; description: string; path: string }): Metadata {
  const resolvedPath = normalizePath(page.slug ?? fallback.path);
  const title = page.metaTitle || page.title || fallback.title;
  const description = page.metaDescription || fallback.description;
  const canonical = page.canonicalUrl || buildLocaleUrl(locale, resolvedPath);
  const ogTitle = page.ogTitle || title;
  const ogDescription = page.ogDescription || description;
  const twitterTitle = page.twitterTitle || ogTitle;
  const twitterDescription = page.twitterDescription || ogDescription;
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((entry) => [entry, buildLocaleUrl(entry, resolvedPath)]),
  );
  languages["x-default"] = buildLocaleUrl(DEFAULT_LOCALE, resolvedPath);

  return {
    title,
    description,
    keywords: page.metaKeywords?.split(",").map((entry) => entry.trim()).filter(Boolean),
    alternates: {
      canonical,
      languages,
    },
    robots: page.robotsDirective || "index,follow",
    openGraph: {
      type: "website",
      locale,
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      images: page.ogImageUrl ? [{ url: page.ogImageUrl, alt: page.ogImageAlt || ogTitle }] : undefined,
    },
    twitter: {
      card: page.twitterImageUrl || page.ogImageUrl ? "summary_large_image" : "summary",
      title: twitterTitle,
      description: twitterDescription,
      images: page.twitterImageUrl ? [page.twitterImageUrl] : page.ogImageUrl ? [page.ogImageUrl] : undefined,
    },
  };
}

export function parseSchemaOrgJson(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as object | object[];
  } catch {
    return null;
  }
}

export function buildDefaultSchemaOrg(page: Partial<PageInput>, locale: AppLocale, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle || page.title || "Paris Greeters",
    description: page.metaDescription || "Découvrez Paris autrement avec les Greeters.",
    inLanguage: locale === DEFAULT_LOCALE ? "fr-FR" : locale,
    url: page.canonicalUrl || buildLocaleUrl(locale, path),
  };
}

export function getStructuredDataPayload(page: Partial<PageInput>, locale: AppLocale, path: string) {
  return parseSchemaOrgJson(page.schemaOrgJson) || buildDefaultSchemaOrg(page, locale, path);
}

export function isIndexablePage(page: Pick<PageResponse, "robotsDirective">) {
  return !(page.robotsDirective || "index,follow").toLowerCase().includes("noindex");
}

export function getSitemapFrequency(page: Pick<PageResponse, "sitemapChangeFreq">) {
  const value = page.sitemapChangeFreq?.toLowerCase();
  return SITEMAP_CHANGEFREQ_OPTIONS.includes(value as (typeof SITEMAP_CHANGEFREQ_OPTIONS)[number]) ? value ?? "monthly" : "monthly";
}

export function getSitemapPriority(page: Pick<PageResponse, "sitemapPriority" | "slug">) {
  if (typeof page.sitemapPriority === "number") {
    return Math.max(0, Math.min(1, page.sitemapPriority));
  }

  return page.slug === "/" ? 1 : 0.7;
}