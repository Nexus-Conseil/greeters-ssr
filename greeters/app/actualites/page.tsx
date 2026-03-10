import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { ACTUALITES_PAGE_ITEMS } from "@/lib/public-pages-data";
import { getActualitesCmsContent } from "@/lib/services/public-page-content";

export const metadata: Metadata = {
  title: "Actualités — Paris Greeters",
};

export default async function ActualitesPage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "actualites");
  const { title, items } = await getActualitesCmsContent(fallbackTitle, ACTUALITES_PAGE_ITEMS);

  return (
    <PublicPageShell testId="actualites-public-page">
      <>
        <PageTitleBand title={title} testId="actualites-public-page-title" />
        <div className="site-container site-content-section" data-testid="actualites-public-page-content">
          <div className="site-news-grid" data-testid="actualites-public-page-grid">
            {items.map((article) => (
              <Link href={article.link as Route} key={article.id} className="site-news-card" data-testid={`actualites-public-card-${article.id}`}>
                <div className="site-news-date" data-testid={`actualites-public-date-${article.id}`}>
                  <span>{article.day}</span>
                  <strong>{article.month}</strong>
                </div>
                <div className="site-news-content">
                  <div className="site-news-thumb">
                    <Image src={article.image} alt={article.title} width={96} height={96} className="site-news-thumb-image" data-testid={`actualites-public-image-${article.id}`} />
                  </div>
                  <div className="site-news-copy">
                    <h2 className="site-news-title" data-testid={`actualites-public-title-${article.id}`}>{article.title}</h2>
                    <p className="site-news-excerpt" data-testid={`actualites-public-excerpt-${article.id}`}>{article.excerpt}</p>
                    <span className="site-news-link">Lire la suite →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </>
    </PublicPageShell>
  );
}