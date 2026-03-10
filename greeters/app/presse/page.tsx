import type { Metadata } from "next";
import Image from "next/image";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { IMAGE_QUALITY_STANDARD, PUBLIC_GALLERY_GRID_SIZES_ATTR } from "@/lib/media/config";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { PRESS_PHOTOS } from "@/lib/public-pages-data";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("presse", {
    title: "Presse — Paris Greeters",
    description: "Téléchargez le dossier de presse et accédez aux ressources médias de Paris Greeters.",
  });
}

export default async function PressePage() {
  const locale = await getRequestLocale();
  const title = getLocalizedPageTitle(locale, "presse");
  const seoPage = await findPublicPageBySlug("presse", locale).catch(() => null);

  return (
    <PublicPageShell testId="presse-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "presse", metaDescription: "Presse Paris Greeters" }} locale={locale} path="presse" />
        <PageTitleBand title={title} testId="presse-public-page-title" />
        {seoPage ? <div className="site-content-shell-narrow site-content-section" data-testid="presse-public-page-cms-content"><DynamicPageRenderer page={seoPage} /></div> : <div className="site-content-shell-narrow site-content-section" data-testid="presse-public-page-content">
            <section className="site-highlight-panel" data-testid="presse-kit-panel">
              <h2 className="site-card-title">Dossier de presse</h2>
              <a href="/documents/a428d596_dossier-de-presse-FFG-2020.pdf" target="_blank" rel="noreferrer" className="site-inline-link" data-testid="presse-kit-link">
                Télécharger le dossier de presse (PDF)
              </a>
            </section>

            <section className="site-block-stack" data-testid="presse-photos-section">
              <h2 className="site-section-subtitle">Photos libres de droit</h2>
              <p className="site-copy-stack">Voici une sélection de photos libres de droit publiées par l'association. Si vous deviez utiliser l'une de ces photos, merci de nous prévenir.</p>
              <div className="site-gallery-grid site-gallery-grid-page">
                {PRESS_PHOTOS.map((photo) => (
                  <a key={photo.id} href={photo.src} target="_blank" rel="noreferrer" className="site-gallery-card" data-testid={`presse-photo-link-${photo.id}`}>
                    <Image src={photo.src} alt={photo.title} width={520} height={520} sizes={PUBLIC_GALLERY_GRID_SIZES_ATTR} quality={IMAGE_QUALITY_STANDARD} className="site-gallery-image" data-testid={`presse-photo-image-${photo.id}`} />
                    <span className="site-gallery-overlay">
                      <strong>{photo.title}</strong>
                      <small>{photo.date}</small>
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="site-info-panel" data-testid="presse-contact-panel">
              <h3 className="site-card-title">Contact Presse</h3>
              <p>Pour toute demande d'information ou d'interview, contactez notre service presse :</p>
              <a href="mailto:presse@parisgreeters.fr" className="site-inline-link" data-testid="presse-contact-link">presse@parisgreeters.fr</a>
            </section>
        </div>}
      </>
    </PublicPageShell>
  );
}