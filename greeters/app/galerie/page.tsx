import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GalleryPageClient } from "@/components/public/pages/GalleryPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { GALLERY_PAGE_IMAGES } from "@/lib/public-pages-data";
import { getGalleryCmsContent } from "@/lib/services/public-page-content";

export const metadata: Metadata = {
  title: "Galerie — Paris Greeters",
};

export default async function GaleriePage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "galerie");
  const { title, items } = await getGalleryCmsContent(fallbackTitle, GALLERY_PAGE_IMAGES);

  return (
    <PublicPageShell testId="galerie-public-page">
      <>
        <PageTitleBand title={title} testId="galerie-public-page-title" />
        <GalleryPageClient items={items} />
      </>
    </PublicPageShell>
  );
}