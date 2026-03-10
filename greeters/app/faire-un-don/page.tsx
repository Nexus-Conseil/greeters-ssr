import type { Metadata } from "next";
import Image from "next/image";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { PUBLIC_IMAGE_SIZES_ATTR } from "@/lib/media/config";
import { findPublicPageBySlug } from "@/lib/services/pages";
import { getRouteMetadata } from "@/lib/seo/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("faire-un-don", {
    title: "Faire un don — Paris Greeters",
    description: "Soutenez Paris Greeters et permettez à l’association de poursuivre ses balades gratuites et conviviales.",
  });
}

export default async function FaireUnDonPage() {
  const locale = await getRequestLocale();
  const title = getLocalizedPageTitle(locale, "faire-un-don");
  const seoPage = await findPublicPageBySlug("faire-un-don", locale).catch(() => null);

  return (
    <PublicPageShell testId="faire-un-don-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "faire-un-don", metaDescription: "Soutenir Paris Greeters" }} locale={locale} path="faire-un-don" />
        <PageTitleBand title={title} testId="faire-un-don-public-page-title" />
        {seoPage ? <div className="site-content-shell-narrow site-content-section" data-testid="faire-un-don-public-page-cms-content"><DynamicPageRenderer page={seoPage} /></div> : <div className="site-content-shell-narrow site-content-section" data-testid="faire-un-don-public-page-content">
            <section className="site-info-panel" data-testid="faire-un-don-intro-panel">
              <h2 className="site-card-title">Soutenez les Greeters de Paris</h2>
              <p>Vous avez été satisfait de votre balade avec un bénévole de « Parisien d'un jour – Paris Greeters », alors n'hésitez pas à nous soutenir. <strong>Notre association fonctionne uniquement grâce aux dons.</strong></p>
            </section>

            <section className="site-feature-grid site-feature-grid-2" data-testid="faire-un-don-payment-options">
              <article className="site-feature-card" data-testid="faire-un-don-paypal-card">
                <h3 className="site-card-title">Par PayPal</h3>
                <p>Don en ligne sécurisé : vous n'avez pas besoin d'avoir un compte PayPal, votre carte bancaire suffit.</p>
                <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" className="site-inline-form" data-testid="faire-un-don-paypal-form">
                  <input type="hidden" name="cmd" value="_donations" />
                  <input type="hidden" name="item_name" value="Paris Greeters" />
                  <input type="hidden" name="business" value="parisiendunjour@gmail.com" />
                  <input type="hidden" name="currency_code" value="EUR" />
                  <label className="site-inline-form-label" htmlFor="don-amount">Je donne</label>
                  <input id="don-amount" type="number" name="amount" min="1" step="1" defaultValue="30" className="site-inline-form-input" data-testid="faire-un-don-amount-input" />
                  <button type="submit" className="site-cta-button site-inline-form-button" data-testid="faire-un-don-paypal-submit-button">Faire un don</button>
                </form>
              </article>

              <article className="site-feature-card" data-testid="faire-un-don-cheque-card">
                <h3 className="site-card-title">Par chèque</h3>
                <p>À l'ordre de l'association, à l'adresse suivante :</p>
                <div className="site-mini-panel" data-testid="faire-un-don-cheque-address">
                  <p className="site-mini-panel-title">Trésorier Parisien d'un jour</p>
                  <p>Maison de la vie associative et citoyenne Paris Centre</p>
                  <p>Bal N°50 – 5 Rue Perrée</p>
                  <p>75003 PARIS (France)</p>
                </div>
              </article>

              <article className="site-feature-card" data-testid="faire-un-don-transfer-card">
                <h3 className="site-card-title">Par virement bancaire</h3>
                <div className="site-copy-stack">
                  <p><strong>Titulaire :</strong> Parisien d'un jour, parisien toujours</p>
                  <p><strong>N° compte :</strong> 5367998L020</p>
                  <p><strong>IBAN :</strong> FR20 2004 1000 01 53 67 99 8L02 029</p>
                  <p><strong>BIC :</strong> PSSTFRPPPAR</p>
                  <p><strong>Banque :</strong> La Banque Postale</p>
                </div>
              </article>

              <article className="site-highlight-panel" data-testid="faire-un-don-direct-card">
                <h3 className="site-card-title">Don direct à votre Greeter</h3>
                <p>Vous pouvez également effectuer un don directement auprès de votre Greeter : ce dernier le reversera à l'association.</p>
              </article>
            </section>

            <p className="site-note-centered" data-testid="faire-un-don-note">Les Greeters de Paris est une association loi 1901 à but non lucratif. Merci de votre soutien !</p>

            <div className="site-illustration-card" data-testid="faire-un-don-image-card">
              <Image src="/images/uploads/greeters-balade-2.jpg" alt="Balade avec les Greeters de Paris" width={1200} height={800} sizes={PUBLIC_IMAGE_SIZES_ATTR} quality={100} className="site-illustration-image" data-testid="faire-un-don-image" />
            </div>
        </div>}
      </>
    </PublicPageShell>
  );
}