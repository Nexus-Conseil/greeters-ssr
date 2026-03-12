import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Calendar } from "lucide-react";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
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
        <div className="max-w-7xl mx-auto px-4 py-12" data-testid="actualites-public-page-content">
          <h1 className="text-3xl md:text-4xl font-light text-gray-800 mb-10 text-center uppercase tracking-wider" data-testid="actualites-heading">
            {title}
          </h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="actualites-public-page-grid">
            {items.map((article) => (
              <Link
                href={article.link as Route}
                prefetch={false}
                key={article.id}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                data-testid={`actualites-public-card-${article.id}`}
              >
                <div className="aspect-video overflow-hidden" data-testid={`actualites-public-image-wrapper-${article.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    data-testid={`actualites-public-image-${article.id}`}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-[#8bc34a] text-sm mb-3" data-testid={`actualites-public-date-${article.id}`}>
                    <Calendar size={14} />
                    <span>{article.day} {article.month}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3 group-hover:text-[#8bc34a] transition-colors" data-testid={`actualites-public-title-${article.id}`}>
                    {article.title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4" data-testid={`actualites-public-excerpt-${article.id}`}>
                    {article.excerpt}
                  </p>
                  <div className="flex items-center text-[#8bc34a] text-sm font-medium group-hover:underline">
                    Lire la suite
                    <ArrowRight size={14} className="ml-1" />
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
