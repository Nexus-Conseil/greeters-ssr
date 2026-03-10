import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { ContactPageClient } from "@/components/public/pages/ContactPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { getPublicPageOverrideContent } from "@/lib/services/public-page-override";

export const metadata: Metadata = {
  title: "Contact — Paris Greeters",
};

export default async function ContactPage() {
  const cmsContent = await getPublicPageOverrideContent("contact", "contact-public-page-cms-content");

  return (
    <PublicPageShell testId="contact-public-page">
      {cmsContent ?? (
        <>
          <PageTitleBand title="Contact" testId="contact-public-page-title" />
          <ContactPageClient />
        </>
      )}
    </PublicPageShell>
  );
}