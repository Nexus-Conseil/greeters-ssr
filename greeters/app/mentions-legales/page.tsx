import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";

export const metadata: Metadata = {
  title: "Mentions légales — Paris Greeters",
};

export default async function MentionsLegalesPage() {
  const locale = await getRequestLocale();
  const title = getLocalizedPageTitle(locale, "mentions-legales");

  return (
    <PublicPageShell testId="mentions-legales-public-page">
      <>
        <PageTitleBand title={title} testId="mentions-legales-public-page-title" />
        <div className="site-container site-content-section" data-testid="mentions-legales-public-page-content">
            <section className="site-info-panel" data-testid="mentions-legales-editor-panel">
              <h2 className="site-card-title">Éditeur, conception et réalisation</h2>
              <p><strong>Association « Parisien d'un jour – Paris Greeters »</strong></p>
              <p>Maison de la vie associative et citoyenne du 3e et 4e</p>
              <p>Bal N°50 – 5 Rue Perrée</p>
              <p>75003 PARIS (France)</p>
              <p>Association à but non lucratif, créée le 27 Novembre 2006</p>
              <p>SIRET : 494 059 827 00043</p>
            </section>

            <section className="site-highlight-panel" data-testid="mentions-legales-charte-panel">
              <h2 className="site-card-title">La Charte Parisien d'un jour</h2>
              <p>L'association Parisien d'un jour, membre du réseau international Global Greeters, engage chacun de ses membres adhérents à respecter et à suivre sa charte.</p>
              <a href="/documents/8cae8c91_charte-2020.pdf" target="_blank" rel="noreferrer" className="site-inline-link" data-testid="mentions-legales-charte-link">Télécharger la Charte des Greeters de « Parisien d'un Jour »</a>
            </section>

            <section className="site-block-stack" data-testid="mentions-legales-responsabilites-section">
              <h2 className="site-section-subtitle">Responsabilités</h2>
              <div className="site-feature-grid site-feature-grid-1">
                <article className="site-feature-card" data-testid="mentions-legales-responsabilite-balades"><h3 className="site-card-title">Responsabilité lors des balades</h3><p>Les balades se font sous la responsabilité de chacun des participants. L'association décline toute responsabilité en cas d'incident ou d'accident.</p></article>
                <article className="site-feature-card" data-testid="mentions-legales-responsabilite-informations"><h3 className="site-card-title">Informations du site</h3><p>Les informations mises en ligne sur le site étaient correctes au moment de leur publication. Le site est régulièrement mis à jour.</p></article>
                <article className="site-feature-card" data-testid="mentions-legales-responsabilite-liens"><h3 className="site-card-title">Liens externes</h3><p>Des liens externes vers des sites partenaires et amis du tourisme participatif sont mis en ligne. L'association n'est pas responsable des prestations délivrées par ces tiers.</p></article>
              </div>
            </section>

            <section className="site-info-panel" data-testid="mentions-legales-hebergement-panel">
              <h2 className="site-card-title">Hébergement</h2>
              <p>Ce site est hébergé par Nexus Conseil.</p>
            </section>
        </div>
      </>
    </PublicPageShell>
  );
}