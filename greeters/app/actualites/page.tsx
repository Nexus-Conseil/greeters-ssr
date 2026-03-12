import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Calendar } from "lucide-react";

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
        <div className="max-w-7xl mx-auto px-4 py-12" data-testid="actualites-public-page-content">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="actualites-public-page-grid">
            {items.map((article) => (
              <Link href={article.link as Route} prefetch={false} key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group border border-gray-100" data-testid={`actualites-public-card-${article.id}`}>
                <div className="aspect-[16/9] overflow-hidden bg-gray-100" data-testid={`actualites-public-image-wrapper-${article.id}`}>
                  <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" data-testid={`actualites-public-image-${article.id}`} />
                </div>
                <div className="p-6">
                  <p className="flex items-center gap-2 text-[#8cab4f] text-sm mb-4" data-testid={`actualites-public-date-${article.id}`}>
                    <Calendar size={16} />
                    <span>{article.day} {article.month}</span>
                  </p>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3 leading-tight" data-testid={`actualites-public-title-${article.id}`}>{article.title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4" data-testid={`actualites-public-excerpt-${article.id}`}>{article.excerpt}</p>
                  <span className="inline-flex items-center gap-2 text-[#8cab4f] hover:text-[#689f38] font-medium transition-colors">Lire la suite <ArrowRight size={16} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </>
    </PublicPageShell>
  );
}