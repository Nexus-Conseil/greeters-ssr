import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { SimplePageHeading } from "@/components/public/pages/SimplePageHeading";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { ACTUALITES_PAGE_ITEMS } from "@/lib/public-pages-data";
import { getActualitesCmsContent } from "@/lib/services/public-page-content";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("actualites", {
    title: "Actualités — Paris Greeters",
    description: "Retrouvez les actualités, annonces et informations utiles autour de Paris Greeters.",
  });
}

export default async function ActualitesPage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "actualites");
  const seoPage = await findPublicPageBySlug("actualites", locale).catch(() => null);
  const { title, items } = await getActualitesCmsContent(fallbackTitle, ACTUALITES_PAGE_ITEMS);

  return (
    <PublicPageShell testId="actualites-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "actualites", metaDescription: "Actualités Paris Greeters" }} locale={locale} path="actualites" />
        <SimplePageHeading title={title} testId="actualites-public-page-title" />
        <div className="site-container site-content-section" data-testid="actualites-public-page-content">
          <div className="site-articles-grid" data-testid="actualites-public-page-grid">
            {items.map((article) => (
              <Link href={article.link as Route} key={article.id} className="site-article-card" data-testid={`actualites-public-card-${article.id}`}>
                <div className="site-article-media" data-testid={`actualites-public-image-wrapper-${article.id}`}>
                  <Image src={article.image} alt={article.title} width={520} height={292} sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) 50vw, 33vw" quality={100} className="site-article-image" data-testid={`actualites-public-image-${article.id}`} />
                </div>
                <div className="site-article-content">
                  <p className="site-article-date" data-testid={`actualites-public-date-${article.id}`}>
                    <span className="site-article-date-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10ZM8 6H6v2h12V6h-2v1h-2V6h-4v1H8V6Z" fill="currentColor" />
                      </svg>
                    </span>
                    <span>{article.day} {article.month}</span>
                  </p>
                  <h2 className="site-article-title" data-testid={`actualites-public-title-${article.id}`}>{article.title}</h2>
                  <p className="site-article-excerpt" data-testid={`actualites-public-excerpt-${article.id}`}>{article.excerpt}</p>
                  <span className="site-article-link">Lire la suite</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </>
    </PublicPageShell>
  );
}