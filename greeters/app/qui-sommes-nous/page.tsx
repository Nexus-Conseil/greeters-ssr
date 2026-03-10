import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { WHO_WE_ARE_VALUES } from "@/lib/public-pages-data";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("qui-sommes-nous", {
    title: "Qui sommes-nous ? — Paris Greeters",
    description: "Découvrez l’association Paris Greeters, ses valeurs et sa vision d’un tourisme humain et durable.",
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
        <PageTitleBand title={title} testId="qui-sommes-nous-public-page-title" />
        {seoPage ? <div className="site-content-shell-narrow site-content-section" data-testid="qui-sommes-nous-public-page-cms-content"><DynamicPageRenderer page={seoPage} /></div> : <div className="site-content-shell-narrow site-content-section" data-testid="qui-sommes-nous-public-page-content">
          <section className="site-info-panel" data-testid="qui-sommes-nous-intro-panel">
            <p>
              Association loi 1901 à but non lucratif, <strong>« Parisien d'un jour – Paris Greeters »</strong> organise des balades gratuites dans la ville de Paris ou dans les communes alentours, accessibles par le métro, hors des sentiers battus et loin des grands axes touristiques.
            </p>
            <a href="/documents/8cae8c91_charte-2020.pdf" target="_blank" rel="noreferrer" className="site-inline-link" data-testid="qui-sommes-nous-charte-link">
              Télécharger la charte
            </a>
          </section>

          <section className="site-highlight-panel" data-testid="qui-sommes-nous-iga-panel">
            « Parisien d'un jour - Paris Greeters » est membre de l'<strong>International Greeters Association (IGA)</strong> et s'engage à respecter les valeurs fondamentales de celle-ci.
          </section>

          <section className="site-block-stack" data-testid="qui-sommes-nous-values-section">
            <h2 className="site-section-subtitle" data-testid="qui-sommes-nous-values-title">Nos valeurs</h2>
            <div className="site-feature-grid">
              {WHO_WE_ARE_VALUES.map((item, index) => (
                <article key={item} className="site-feature-card" data-testid={`qui-sommes-nous-value-card-${index}`}>
                  {item}
                </article>
              ))}
            </div>
          </section>

          <section className="site-block-stack site-copy-stack" data-testid="qui-sommes-nous-text-section">
            <p>Les réseaux de Greeters s'inscrivent dans une démarche de <strong>tourisme durable</strong> en respectant l'environnement et l'homme.</p>
            <p>Ils participent à l'enrichissement culturel et économique des communautés locales et contribuent ainsi à donner une image positive de la destination.</p>
            <p>Les réseaux de Greeters favorisent l'enrichissement mutuel et les échanges culturels entre individus pour un monde meilleur.</p>
          </section>

          <section className="site-warning-panel" data-testid="qui-sommes-nous-warning-panel">
            <h3 className="site-card-title" data-testid="qui-sommes-nous-warning-title">Important</h3>
            <p>Les visites proposées par les Greeters sont uniquement des balades amicales dans un quartier fréquenté régulièrement par le Greeter. Nous ne proposons aucune visite de musée ou nécessitant une expertise spécifique.</p>
          </section>
        </div>}
      </>
    </PublicPageShell>
  );
}