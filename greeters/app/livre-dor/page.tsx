import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GuestbookPageClient } from "@/components/public/pages/GuestbookPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { GUESTBOOK_ITEMS } from "@/lib/public-pages-data";
import { getGuestbookCmsContent } from "@/lib/services/public-page-content";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("livre-dor", {
    title: "Livre d'or — Paris Greeters",
    description: "Lisez les retours et témoignages des visiteurs qui ont découvert Paris avec les Greeters.",
  });
}

export default async function LivreDorPage() {
  const locale = await getRequestLocale();
  const fallbackTitle = getLocalizedPageTitle(locale, "livre-dor");
  const seoPage = await findPublicPageBySlug("livre-dor", locale).catch(() => null);
  const { title, items } = await getGuestbookCmsContent(fallbackTitle, GUESTBOOK_ITEMS);

  return (
    <PublicPageShell testId="livre-dor-public-page">
      <>
        <StructuredDataScript page={seoPage ?? { title, slug: "livre-dor", metaDescription: "Livre d'or Paris Greeters" }} locale={locale} path="livre-dor" />
        <PageTitleBand title={title} testId="livre-dor-public-page-title" />
        <GuestbookPageClient items={items} />
      </>
    </PublicPageShell>
  );
}