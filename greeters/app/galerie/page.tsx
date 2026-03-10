import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GalleryPageClient } from "@/components/public/pages/GalleryPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { GALLERY_PAGE_IMAGES } from "@/lib/public-pages-data";
import { getPublicPageOverrideContent } from "@/lib/services/public-page-override";

export const metadata: Metadata = {
  title: "Galerie — Paris Greeters",
};

export default async function GaleriePage() {
  const cmsContent = await getPublicPageOverrideContent("galerie", "galerie-public-page-cms-content");

  return (
    <PublicPageShell testId="galerie-public-page">
      {cmsContent ?? (
        <>
          <PageTitleBand title="Galerie" testId="galerie-public-page-title" />
          <GalleryPageClient items={GALLERY_PAGE_IMAGES} />
        </>
      )}
    </PublicPageShell>
  );
}