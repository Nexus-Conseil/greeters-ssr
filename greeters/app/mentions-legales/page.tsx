import type { Metadata } from "next";
import { FileText, AlertTriangle, ExternalLink } from "lucide-react";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("mentions-legales", {
    title: "Mentions légales — Paris Greeters",
    description: "Mentions légales de l'association Paris Greeters.",
  });
}

export default async function MentionsLegalesPage() {
  const locale = await getRequestLocale();
  const title = getLocalizedPageTitle(locale, "mentions-legales");
  const seoPage = await findPublicPageBySlug("mentions-legales", locale).catch(() => null);

  return (
    <PublicPageShell testId="mentions-legales-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "mentions-legales", metaDescription: "Mentions légales Paris Greeters" }} locale={locale} path="mentions-legales" />

        {/* Section titre avec fond vert */}
        <section className="bg-[#8bc34a] py-12" data-testid="mentions-legales-title-band">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-light text-white mb-0 text-center uppercase tracking-wider" data-testid="mentions-legales-heading">
              Mentions légales
            </h1>
          </div>
        </section>

        <section className="py-12" data-testid="mentions-legales-content">
          <div className="max-w-4xl mx-auto px-4">
            {/* Éditeur */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Éditeur, conception et réalisation</h2>
              <div className="bg-gray-50 rounded-lg p-6" data-testid="mentions-legales-editor-panel">
                <p className="text-gray-700 mb-2">
                  <strong>Association « Parisien d&apos;un jour – Paris Greeters »</strong>
                </p>
                <address className="text-gray-600 not-italic mb-4">
                  Maison de la vie associative et citoyenne du 3e et 4e<br />
                  Bal N°50 – 5 Rue Perrée<br />
                  75003 PARIS (France)
                </address>
                <p className="text-gray-600 text-sm">
                  Association à but non lucratif, créée le 27 Novembre 2006<br />
                  SIRET : 494 059 827 00043
                </p>
              </div>
            </div>

            {/* Charte */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">La Charte Parisien d&apos;un jour</h2>
              <div className="bg-[#f5f9f0] border border-[#c5e1a5] rounded-lg p-6" data-testid="mentions-legales-charte-panel">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-[#558b2f] flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-700 mb-4">
                      L&apos;association Parisien d&apos;un jour, membre du réseau international Global Greeters, engage chacun de ses membres adhérents à respecter et à suivre sa charte, gage de qualité auprès de nos visiteurs.
                    </p>
                    <a
                      href="/documents/8cae8c91_charte-2020.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#558b2f] hover:text-[#33691e] font-medium"
                      data-testid="mentions-legales-charte-link"
                    >
                      <ExternalLink size={16} />
                      Télécharger la Charte des Greeters de « Parisien d&apos;un Jour »
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Responsabilités */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Responsabilités
              </h2>
              <div className="space-y-4" data-testid="mentions-legales-responsabilities">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium text-gray-800 mb-2">Responsabilité lors des balades</h3>
                  <p className="text-gray-600 text-sm">
                    Les balades se font sous la responsabilité de chacun des participants. L&apos;association Parisien d&apos;un jour décline toute responsabilité en cas d&apos;incident ou d&apos;accident au cours des balades.
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium text-gray-800 mb-2">Informations du site</h3>
                  <p className="text-gray-600 text-sm">
                    Les informations mises en ligne sur le site étaient correctes au moment de leur publication. Le site est régulièrement mis à jour. L&apos;association Parisien d&apos;un jour - Paris Greeter ne peut être tenue pour responsable de toute perte, dommage ou désagrément qui pourraient résulter de l&apos;utilisation des informations publiées sur le site.
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium text-gray-800 mb-2">Liens externes</h3>
                  <p className="text-gray-600 text-sm">
                    Des liens externes vers des sites partenaires et des sites « amis du Tourisme participatif » sont mis en ligne. L&apos;association n&apos;est pas responsable de la qualité des prestations délivrées et ne peut être mise en cause en cas de litige avec ces partenaires et « amis ».
                  </p>
                </div>
              </div>
            </div>

            {/* Hébergement */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Hébergement</h2>
              <div className="bg-gray-50 rounded-lg p-6" data-testid="mentions-legales-hosting-panel">
                <p className="text-gray-600 text-sm">
                  Ce site est hébergé par Nexus Conseil.
                </p>
              </div>
            </div>
          </div>
        </section>
      </>
    </PublicPageShell>
  );
}
