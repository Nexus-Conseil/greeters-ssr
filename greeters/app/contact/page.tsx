import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { ContactPageClient } from "@/components/public/pages/ContactPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getContactCmsContent } from "@/lib/services/public-page-content";

export const metadata: Metadata = {
  title: "Contact — Paris Greeters",
};

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "contact");
  const { title, intro } = await getContactCmsContent(
    fallbackTitle,
    "Si vous souhaitez savoir où en est votre demande, y apporter des modifications, obtenir un remboursement de votre don ou obtenir plus d'informations sur Parisien d'un jour – Paris Greeters, envoyez-nous un message via le formulaire de contact.",
  );

  return (
    <PublicPageShell testId="contact-public-page">
      <PageTitleBand title={title} testId="contact-public-page-title" />
      <ContactPageClient introText={intro} />
    </PublicPageShell>
  );
}