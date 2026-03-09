import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { ContactPageClient } from "@/components/public/pages/ContactPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";

export const metadata: Metadata = {
  title: "Contact — Paris Greeters",
};

export default async function ContactPage() {
  return (
    <PublicPageShell testId="contact-public-page">
      <PageTitleBand title="Contact" testId="contact-public-page-title" />
      <ContactPageClient />
    </PublicPageShell>
  );
}