import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GalleryPageClient } from "@/components/public/pages/GalleryPageClient";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { GALLERY_PAGE_IMAGES } from "@/lib/public-pages-data";
import { getGalleryCmsContent } from "@/lib/services/public-page-content";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("galerie", {
    title: "Galerie — Paris Greeters",
    description: "Explorez la galerie photo des balades et rencontres proposées par Paris Greeters.",
  });
}

export default async function GaleriePage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "galerie");
  const seoPage = await findPublicPageBySlug("galerie", locale).catch(() => null);
  const { title, items } = await getGalleryCmsContent(fallbackTitle, GALLERY_PAGE_IMAGES);

  return (
    <PublicPageShell testId="galerie-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "galerie", metaDescription: "Galerie Paris Greeters" }} locale={locale} path="galerie" />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-light text-gray-800 mb-10 text-center uppercase tracking-wider" data-testid="galerie-heading">
            {title}
          </h1>
        </div>
        <GalleryPageClient items={items} />
      </>
    </PublicPageShell>
  );
}
