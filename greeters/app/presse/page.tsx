import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
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
        <div className="site-content-shell-narrow site-content-section" data-testid="presse-public-page-content">
          <section className="site-highlight-panel site-press-panel" data-testid="presse-kit-panel">
            <div className="site-press-heading-row">
              <span className="site-press-icon" data-testid="presse-kit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L18.5 9H15Zm-7 4h8v1.5H8V13Zm0 3h8v1.5H8V16Zm0-6h3v1.5H8V10Z" /></svg>
              </span>
              <div>
                <h2 className="site-card-title">Dossier de presse</h2>
                <a href="/documents/a428d596_dossier-de-presse-FFG-2020.pdf" target="_blank" rel="noreferrer" className="site-inline-link" data-testid="presse-kit-link">
                  Télécharger le dossier de presse (PDF) →
                </a>
              </div>
            </div>
          </section>

          <section className="site-block-stack site-press-panel" data-testid="presse-photos-section">
            <div className="site-press-heading-row">
              <span className="site-press-icon" data-testid="presse-photos-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm0 2h14v10.2l-3.8-3.8a1 1 0 0 0-1.4 0l-2.2 2.2-1.6-1.6a1 1 0 0 0-1.4 0L5 15.6V5Zm9 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM5 18.4l3.8-3.8 1.6 1.6a1 1 0 0 0 1.4 0l2.2-2.2 5 5H5Z" /></svg>
              </span>
              <h2 className="site-section-subtitle">Photos libres de droit</h2>
            </div>
            <p className="site-copy-stack">Voici une sélection de photos libres de droit publiées par l&apos;association. Si vous deviez utiliser l&apos;une de ces photos, merci de nous prévenir. Cliquez sur une photo pour télécharger le fichier en haute résolution.</p>
            <div className="site-press-photo-grid" data-testid="presse-photo-grid">
              {PRESS_PHOTOS.map((photo) => (
                <a key={photo.id} href={photo.src} target="_blank" rel="noreferrer" className="site-gallery-card site-press-photo-card" data-testid={`presse-photo-link-${photo.id}`}>
                  <img src={photo.src} alt={photo.title} className="site-gallery-image" loading="lazy" decoding="async" data-testid={`presse-photo-image-${photo.id}`} />
                  <span className="site-gallery-overlay">
                    <strong>{photo.title}</strong>
                    <small>{photo.date}</small>
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="site-info-panel site-press-panel" data-testid="presse-contact-panel">
            <div className="site-press-heading-row">
              <span className="site-press-icon" data-testid="presse-contact-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 2v.5l9 5.63 9-5.63V7l-9 5.63L3 7.01ZM21 17V9.84l-8.47 5.3a1 1 0 0 1-1.06 0L3 9.84V17h18Z" /></svg>
              </span>
              <h3 className="site-card-title">Contact Presse</h3>
            </div>
            <p>Pour toute demande d'information ou d'interview, contactez notre service presse :</p>
            <a href="mailto:presse@parisgreeters.fr" className="site-inline-link" data-testid="presse-contact-link">presse@parisgreeters.fr</a>
          </section>
        </div>
      </>
    </PublicPageShell>
  );
}