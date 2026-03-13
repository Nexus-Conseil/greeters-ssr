import type { Metadata } from "next";
import { FileText, Mail, Image as ImageIcon } from "lucide-react";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
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

        {/* Section titre avec fond vert */}
        <section className="bg-[#8bc34a] py-12" data-testid="presse-title-band">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-light text-white mb-0 text-center uppercase tracking-wider" data-testid="presse-heading">
              Presse
            </h1>
          </div>
        </section>

        <section className="py-12" data-testid="presse-content">
          <div className="max-w-4xl mx-auto px-4">
            {/* Dossier de presse */}
            <div className="bg-[#f5f9f0] border border-[#c5e1a5] rounded-lg p-6 mb-8" data-testid="presse-kit-panel">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-[#558b2f]" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Dossier de presse</h2>
                  <a
                    href="/documents/a428d596_dossier-de-presse-FFG-2020.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#558b2f] hover:text-[#33691e] font-medium"
                    data-testid="presse-kit-link"
                  >
                    Télécharger le dossier de presse (PDF) &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Photos libres de droit */}
            <div className="mb-8" data-testid="presse-photos-section">
              <div className="flex items-center gap-3 mb-4">
                <ImageIcon className="w-6 h-6 text-[#558b2f]" />
                <h2 className="text-xl font-semibold text-gray-800">Photos libres de droit</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Voici une sélection de photos libres de droit publiées par l&apos;association. Si vous deviez utiliser l&apos;une de ces photos, merci de nous prévenir. Cliquez sur une photo pour télécharger le fichier en haute résolution.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6" data-testid="presse-photo-grid">
                {PRESS_PHOTOS.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                    data-testid={`presse-photo-link-${photo.id}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      data-testid={`presse-photo-image-${photo.id}`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm font-medium">{photo.title}</p>
                        <p className="text-xs opacity-75">{photo.date}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact presse */}
            <div className="bg-gray-50 rounded-lg p-6" data-testid="presse-contact-panel">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-[#558b2f]" />
                <h3 className="text-lg font-semibold text-gray-800">Contact Presse</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Pour toute demande d&apos;information ou d&apos;interview, contactez notre service presse :
              </p>
              <a
                href="mailto:presse@parisgreeters.fr"
                className="inline-flex items-center gap-2 text-[#558b2f] hover:text-[#33691e] font-medium"
                data-testid="presse-contact-link"
              >
                presse@parisgreeters.fr
              </a>
            </div>
          </div>
        </section>
      </>
    </PublicPageShell>
  );
}
