import type { Metadata } from "next";
import Image from "next/image";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { PRESS_PHOTOS } from "@/lib/public-pages-data";
import { getPublicPageOverrideContent } from "@/lib/services/public-page-override";

export const metadata: Metadata = {
  title: "Presse — Paris Greeters",
};

export default async function PressePage() {
  const cmsContent = await getPublicPageOverrideContent("presse", "presse-public-page-cms-content");

  return (
    <PublicPageShell testId="presse-public-page">
      {cmsContent ?? (
        <>
          <PageTitleBand title="Presse" testId="presse-public-page-title" />
          <div className="site-container site-content-section" data-testid="presse-public-page-content">
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
                    <Image src={photo.src} alt={photo.title} width={520} height={520} className="site-gallery-image" data-testid={`presse-photo-image-${photo.id}`} />
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
          </div>
        </>
      )}
    </PublicPageShell>
  );
}