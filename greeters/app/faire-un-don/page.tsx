import type { Metadata } from "next";
import Image from "next/image";
import { Heart, Building, Banknote } from "lucide-react";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("faire-un-don", {
    title: "Faire un don — Paris Greeters",
    description: "Soutenez Paris Greeters et permettez à l'association de poursuivre ses balades gratuites et conviviales.",
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

        {/* Section titre avec fond vert */}
        <section className="bg-[#8bc34a] py-12" data-testid="faire-un-don-title-band">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-light text-white mb-0 text-center uppercase tracking-wider" data-testid="faire-un-don-heading">
              Faire un don
            </h1>
          </div>
        </section>

        <section className="py-12" data-testid="faire-un-don-content">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-gray-50 rounded-lg p-8 mb-8" data-testid="faire-un-don-intro-panel">
              <div className="flex items-start gap-4 mb-6">
                <Heart className="w-8 h-8 text-[#558b2f] flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-3">Soutenez les Greeters de Paris</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Vous avez été satisfait de votre balade avec un bénévole de « Parisien d&apos;un jour – Paris Greeters », alors n&apos;hésitez pas à nous soutenir. <strong>Notre association fonctionne uniquement grâce aux dons.</strong> Cela nous permet de continuer à développer notre activité et de vous proposer toujours plus de visites et d&apos;activités insolites dans Paris !
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8" data-testid="faire-un-don-payment-options-top">
              {/* PayPal */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="faire-un-don-paypal-card">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Par</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
                    alt="PayPal"
                    className="h-6"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Don en ligne sécurisé en utilisant le service PayPal : vous n&apos;avez pas besoin d&apos;avoir un compte PayPal, votre carte bancaire suffit pour utiliser ce service.
                </p>
                <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" data-testid="faire-un-don-paypal-form">
                  <input type="hidden" name="cmd" value="_donations" />
                  <input type="hidden" name="item_name" value="Paris Greeters" />
                  <input type="hidden" name="business" value="parisiendunjour@gmail.com" />
                  <input type="hidden" name="rm" value="0" />
                  <input type="hidden" name="currency_code" value="EUR" />
                  <input type="hidden" name="lc" value="FR" />
                  <input type="hidden" name="bn" value="PP-DonationsBF:btn_donateCC_LG.gif:NonHosted" />
                  <div className="flex items-center gap-3">
                    <label className="text-gray-700 font-medium whitespace-nowrap">Je donne</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="amount"
                        defaultValue="30"
                        min="1"
                        step="1"
                        className="w-20 px-2 py-2 pr-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0070ba] focus:border-transparent text-right font-medium"
                        required
                        data-testid="faire-un-don-amount-input"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 font-medium">&euro;</span>
                    </div>
                    <button
                      type="submit"
                      className="bg-[#0070ba] hover:bg-[#003087] text-white font-semibold px-5 py-2 h-[42px] whitespace-nowrap rounded-md transition-colors"
                      data-testid="faire-un-don-paypal-submit-button"
                    >
                      Faire un don
                    </button>
                  </div>
                </form>
              </div>

              {/* Chèque */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="faire-un-don-cheque-card">
                <div className="flex items-center gap-3 mb-4">
                  <Banknote className="w-6 h-6 text-[#558b2f]" />
                  <h3 className="text-lg font-semibold text-gray-700">Par chèque</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  À l&apos;ordre de l&apos;association, à l&apos;adresse suivante :
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-600" data-testid="faire-un-don-cheque-address">
                  <p className="font-medium">Trésorier Parisien d&apos;un jour</p>
                  <p>Maison de la vie associative et citoyenne Paris Centre</p>
                  <p>Bal N°50 – 5 Rue Perrée</p>
                  <p>75003 PARIS (France)</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8" data-testid="faire-un-don-payment-options-bottom">
              {/* Virement bancaire */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="faire-un-don-transfer-card">
                <div className="flex items-center gap-3 mb-4">
                  <Building className="w-6 h-6 text-[#558b2f]" />
                  <h3 className="text-lg font-semibold text-gray-700">Par virement bancaire</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Titulaire :</span> Parisien d&apos;un jour, parisien toujours</p>
                  <p><span className="font-medium">N° compte :</span> 5367998L020</p>
                  <p><span className="font-medium">IBAN :</span> FR20 2004 1000 01 53 67 99 8L02 029</p>
                  <p><span className="font-medium">BIC :</span> PSSTFRPPPAR</p>
                  <p><span className="font-medium">Banque :</span> La Banque Postale</p>
                </div>
              </div>

              {/* Don direct */}
              <div className="bg-[#f5f9f0] border border-[#c5e1a5] rounded-lg p-6 hover:shadow-lg transition-shadow" data-testid="faire-un-don-direct-card">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-[#558b2f]" />
                  <h3 className="text-lg font-semibold text-gray-700">Don direct à votre Greeter</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Vous pouvez également effectuer un don directement auprès de votre Greeter : ce dernier le reversera à l&apos;association.
                </p>
              </div>
            </div>

            <div className="text-center text-gray-500 text-sm mb-8" data-testid="faire-un-don-note">
              <p className="mb-1">Les Greeters de Paris est une association loi 1901 à but non lucratif.</p>
              <p>Merci de votre soutien !</p>
            </div>

            <div className="mb-4" data-testid="faire-un-don-image-card">
              <Image
                src="/images/uploads/greeters-balade-2.jpg"
                alt="Balade avec les Greeters de Paris"
                width={1200}
                height={800}
                className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                data-testid="faire-un-don-image"
              />
            </div>
          </div>
        </section>
      </>
    </PublicPageShell>
  );
}
