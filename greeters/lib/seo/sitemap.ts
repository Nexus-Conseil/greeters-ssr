import { SUPPORTED_LOCALES, DEFAULT_LOCALE, buildLocaleUrl, type AppLocale } from "@/lib/i18n/config";
import { getSitemapFrequency, getSitemapPriority, isIndexablePage } from "@/lib/seo/page-seo";
import { getPublicPages, type PageResponse } from "@/lib/services/pages";

type SitemapEntry = {
  loc: string;
  lastmod: string;
  priority: number;
  changefreq: string;
  alternates: { locale: AppLocale; href: string }[];
};

function buildAlternates(slug: string): { locale: AppLocale; href: string }[] {
  const path = slug === "/" ? "/" : `/${slug}`;
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
    href: buildLocaleUrl(locale, path),
  }));
}

function toEntry(page: PageResponse): SitemapEntry {
  const path = page.slug === "/" ? "/" : `/${page.slug}`;
  return {
    loc: buildLocaleUrl(page.locale, path),
    lastmod: page.updatedAt ?? page.createdAt,
    priority: getSitemapPriority(page),
    changefreq: getSitemapFrequency(page),
    alternates: buildAlternates(page.slug),
  };
}

function renderEntry(entry: SitemapEntry): string {
  const alternateLinks = entry.alternates
    .map(
      (alt) =>
        `    <xhtml:link rel="alternate" hreflang="${alt.locale}" href="${alt.href}" />`
    )
    .join("\n");

  return `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
${alternateLinks}
  </url>`;
}

export async function renderMultilingueSitemapXml(): Promise<string> {
  // Fetch pages for the default locale (fr) as the canonical source
  const pages = await getPublicPages(DEFAULT_LOCALE);

  const entries: SitemapEntry[] = [];

  // Homepage entry for each locale
  for (const locale of SUPPORTED_LOCALES) {
    entries.push({
      loc: buildLocaleUrl(locale, "/"),
      lastmod: new Date().toISOString(),
      priority: 1,
      changefreq: "weekly",
      alternates: buildAlternates("/"),
    });
  }

  // Internal pages — one entry per locale per page
  for (const page of pages) {
    if (page.slug === "/" || !isIndexablePage(page)) continue;

    for (const locale of SUPPORTED_LOCALES) {
      const path = `/${page.slug}`;
      entries.push({
        loc: buildLocaleUrl(locale, path),
        lastmod: page.updatedAt ?? page.createdAt,
        priority: getSitemapPriority(page),
        changefreq: getSitemapFrequency(page),
        alternates: buildAlternates(page.slug),
      });
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(renderEntry).join("\n")}
</urlset>`;
}
