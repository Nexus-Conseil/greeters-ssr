import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GalleryPageClient } from "@/components/public/pages/GalleryPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { GALLERY_PAGE_IMAGES } from "@/lib/public-pages-data";

export const metadata: Metadata = {
  title: "Galerie — Paris Greeters",
};

export default async function GaleriePage() {
  return (
    <PublicPageShell testId="galerie-public-page">
      <PageTitleBand title="Galerie" testId="galerie-public-page-title" />
      <GalleryPageClient items={GALLERY_PAGE_IMAGES} />
    </PublicPageShell>
  );
}