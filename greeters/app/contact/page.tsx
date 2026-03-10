import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { ContactPageClient } from "@/components/public/pages/ContactPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { getContactCmsContent } from "@/lib/services/public-page-content";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("contact", {
    title: "Contact — Paris Greeters",
    description: "Contactez Paris Greeters pour toute question sur une balade, un don ou l’association.",
  });
}

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "contact");
  const seoPage = await findPublicPageBySlug("contact", locale).catch(() => null);
  const { title, intro } = await getContactCmsContent(
    fallbackTitle,
    "Si vous souhaitez savoir où en est votre demande, y apporter des modifications, obtenir un remboursement de votre don ou obtenir plus d'informations sur Parisien d'un jour – Paris Greeters, envoyez-nous un message via le formulaire de contact.",
  );

  return (
    <PublicPageShell testId="contact-public-page">
      <StructuredDataScript page={seoPage ?? { title, slug: "contact", metaDescription: intro }} locale={locale} path="contact" />
      <PageTitleBand title={title} testId="contact-public-page-title" />
      <ContactPageClient introText={intro} />
    </PublicPageShell>
  );
}