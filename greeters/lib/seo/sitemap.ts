import type { AppLocale } from "@/lib/i18n/config";
import { buildLocaleUrl } from "@/lib/i18n/config";
import { getPublicPages, type PageResponse } from "@/lib/services/pages";

type CategorizedEntry = {
  url: string;
  lastModified: string;
};

type CategorizedSitemap = {
  homepage: CategorizedEntry[];
  internalPages: CategorizedEntry[];
  blogArticles: CategorizedEntry[];
};

function isBlogArticle(page: PageResponse) {
  return page.slug.startsWith("actualites/") || page.slug.startsWith("blog/");
}

function toEntry(page: PageResponse): CategorizedEntry {
  const path = page.slug === "/" ? "/" : `/${page.slug}`;
  return {
    url: buildLocaleUrl(page.locale, path),
    lastModified: page.updatedAt ?? page.createdAt,
  };
}

export async function getTourismSitemap(locale: AppLocale): Promise<CategorizedSitemap> {
  const pages = await getPublicPages(locale);
  const categorized: CategorizedSitemap = {
    homepage: [
      {
        url: buildLocaleUrl(locale, "/"),
        lastModified: new Date().toISOString(),
      },
    ],
    internalPages: [],
    blogArticles: [],
  };

  pages.forEach((page) => {
    if (page.slug === "/") {
      return;
    }

    if (isBlogArticle(page)) {
      categorized.blogArticles.push(toEntry(page));
      return;
    }

    categorized.internalPages.push(toEntry(page));
  });

  return categorized;
}

function renderEntries(entries: CategorizedEntry[]) {
  return entries
    .map(
      (entry) => `  <url>\n    <loc>${entry.url}</loc>\n    <lastmod>${entry.lastModified}</lastmod>\n  </url>`,
    )
    .join("\n");
}

export async function renderTourismSitemapXml(locale: AppLocale) {
  const categorized = await getTourismSitemap(locale);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Pages d’accueil -->
${renderEntries(categorized.homepage)}
  <!-- Pages internes utiles aux touristes -->
${renderEntries(categorized.internalPages)}
  <!-- Articles de blog utiles aux touristes -->
${renderEntries(categorized.blogArticles)}
</urlset>`;
}