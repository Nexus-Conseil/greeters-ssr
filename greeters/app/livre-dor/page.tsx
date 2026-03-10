import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GuestbookPageClient } from "@/components/public/pages/GuestbookPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { GUESTBOOK_ITEMS } from "@/lib/public-pages-data";
import { getGuestbookCmsContent } from "@/lib/services/public-page-content";

export const metadata: Metadata = {
  title: "Livre d'or — Paris Greeters",
};

export default async function LivreDorPage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "livre-dor");
  const { title, items } = await getGuestbookCmsContent(fallbackTitle, GUESTBOOK_ITEMS);

  return (
    <PublicPageShell testId="livre-dor-public-page">
      <>
        <PageTitleBand title={title} testId="livre-dor-public-page-title" />
        <GuestbookPageClient items={items} />
      </>
    </PublicPageShell>
  );
}