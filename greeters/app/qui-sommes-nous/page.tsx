import type { Metadata } from "next";
import { FileText, Users, Heart, Globe } from "lucide-react";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("qui-sommes-nous", {
    title: "Qui sommes-nous ? — Paris Greeters",
    description: "Découvrez l'association Paris Greeters, ses valeurs et sa vision d'un tourisme humain et durable.",
  });
}

export default async function QuiSommesNousPage() {
  const locale = await getRequestLocale();
  const title = getLocalizedPageTitle(locale, "qui-sommes-nous");
  const seoPage = await findPublicPageBySlug("qui-sommes-nous", locale).catch(() => null);

  return (
    <PublicPageShell testId="qui-sommes-nous-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "qui-sommes-nous", metaDescription: "Association Paris Greeters" }} locale={locale} path="qui-sommes-nous" />

        {/* Section titre avec fond vert */}
        <section className="bg-[#8bc34a] py-12" data-testid="qui-sommes-nous-title-band">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-light text-white mb-0 text-center uppercase tracking-wider" data-testid="qui-sommes-nous-heading">
              Qui sommes nous?
            </h1>
          </div>
        </section>

        <section className="py-12" data-testid="qui-sommes-nous-content">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-gray-50 rounded-lg p-8 mb-8" data-testid="qui-sommes-nous-intro-panel">
              <p className="text-gray-700 leading-relaxed mb-6">
                Association loi 1901 à but non lucratif, <strong>« Parisien d&apos;un jour – Paris Greeters »</strong> organise des balades gratuites dans la ville de Paris ou dans les communes alentours, accessibles par le métro, hors des sentiers battus et loin des grands axes touristiques.
              </p>
              <a
                href="/documents/8cae8c91_charte-2020.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#558b2f] hover:text-[#33691e] font-medium"
                data-testid="qui-sommes-nous-charte-link"
              >
                <FileText size={18} />
                Télécharger la charte
              </a>
            </div>

            <div className="bg-[#f5f9f0] border border-[#c5e1a5] rounded-lg p-6 mb-8" data-testid="qui-sommes-nous-iga-panel">
              <div className="flex items-start gap-4">
                <Globe className="w-6 h-6 text-[#558b2f] flex-shrink-0 mt-1" />
                <p className="text-gray-700">
                  « Parisien d&apos;un jour - Paris Greeters » est membre de l&apos;<strong>International Greeters Association (IGA)</strong> et s&apos;engage à respecter les valeurs fondamentales de celle-ci.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-light text-gray-800 mb-6" data-testid="qui-sommes-nous-values-title">Nos valeurs</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-8" data-testid="qui-sommes-nous-values-grid">
              <div className="bg-white border border-gray-200 rounded-lg p-5" data-testid="qui-sommes-nous-value-card-0">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#558b2f] flex-shrink-0 mt-1" />
                  <p className="text-gray-600 text-sm">Les Greeters sont bénévoles, ils sont un visage ami pour le(s) visiteur(s).</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5" data-testid="qui-sommes-nous-value-card-1">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#558b2f] flex-shrink-0 mt-1" />
                  <p className="text-gray-600 text-sm">Les Greeters accueillent des individuels et des groupes jusqu&apos;à 6 personnes.</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5" data-testid="qui-sommes-nous-value-card-2">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#558b2f] flex-shrink-0 mt-1" />
                  <p className="text-gray-600 text-sm">La rencontre avec un Greeter est entièrement gratuite.</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5" data-testid="qui-sommes-nous-value-card-3">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-[#558b2f] flex-shrink-0 mt-1" />
                  <p className="text-gray-600 text-sm">Les Greeters accueillent toute personne, visiteur et bénévole, sans aucune discrimination.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-gray-700 leading-relaxed" data-testid="qui-sommes-nous-text-section">
              <p>
                Les réseaux de Greeters s&apos;inscrivent dans une démarche de <strong>tourisme durable</strong> en respectant l&apos;environnement et l&apos;homme.
              </p>
              <p>
                Ils participent à l&apos;enrichissement culturel et économique des communautés locales et contribuent ainsi à donner une image positive de la destination.
              </p>
              <p>
                Les réseaux de Greeters favorisent l&apos;enrichissement mutuel et les échanges culturels entre individus pour un monde meilleur.
              </p>
            </div>

            <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg" data-testid="qui-sommes-nous-warning-panel">
              <h3 className="font-semibold text-gray-800 mb-3" data-testid="qui-sommes-nous-warning-title">Important</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Les visites proposées par les Greeters sont uniquement des balades amicales dans un quartier fréquenté régulièrement par le Greeter (lieu d&apos;habitation ou attache particulière). Nous ne proposons aucune visite de musée ou nécessitant une expertise spécifique. Les visiteurs qui souhaiteraient suivre une visite de ce type doivent s&apos;adresser à un guide professionnel.
              </p>
            </div>
          </div>
        </section>
      </>
    </PublicPageShell>
  );
}
