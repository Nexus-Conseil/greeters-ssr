import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { WHO_WE_ARE_VALUES } from "@/lib/public-pages-data";

export const metadata: Metadata = {
  title: "Qui sommes-nous ? — Paris Greeters",
};

export default async function QuiSommesNousPage() {
  return (
    <PublicPageShell testId="qui-sommes-nous-public-page">
      <PageTitleBand title="Qui sommes nous?" testId="qui-sommes-nous-public-page-title" />
      <div className="site-container site-content-section" data-testid="qui-sommes-nous-public-page-content">
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
      </div>
    </PublicPageShell>
  );
}