import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { ContactPageClient } from "@/components/public/pages/ContactPageClient";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { getContactCmsContent } from "@/lib/services/public-page-content";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("contact", {
    title: "Contact — Paris Greeters",
    description: "Contactez Paris Greeters pour toute question sur une balade, un don ou l'association.",
  });
}

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "contact");
  const seoPage = await findPublicPageBySlug("contact", locale).catch(() => null);
  const { title, intro } = await getContactCmsContent(
    fallbackTitle,
    "Si vous souhaitez savoir où en est votre demande ou bien y apporter des modifications, obtenir un remboursement de votre don ou pour plus d'informations sur Parisien d'un jour – Paris Greeters, envoyez-nous un message via le formulaire de contact.",
  );

  return (
    <PublicPageShell testId="contact-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "contact", metaDescription: intro }} locale={locale} path="contact" />

        {/* Section titre avec fond vert */}
        <section className="bg-[#8bc34a] py-12" data-testid="contact-title-band">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-light text-white mb-4 text-center uppercase tracking-wider" data-testid="contact-heading">
              {title}
            </h1>
          </div>
        </section>

        {/* Section texte intro - fond blanc */}
        <section className="bg-white py-10" data-testid="contact-intro-section">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-gray-700 leading-relaxed text-center text-lg">{intro}</p>
          </div>
        </section>

        <ContactPageClient introText="" />
      </>
    </PublicPageShell>
  );
}
