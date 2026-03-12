import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GuestbookPageClient } from "@/components/public/pages/GuestbookPageClient";
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

        {/* Section titre avec fond vert */}
        <section className="bg-[#8bc34a] py-12" data-testid="livre-dor-title-band">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-light text-white mb-0 text-center uppercase tracking-wider" data-testid="livre-dor-heading">
              {title}
            </h1>
          </div>
        </section>

        <GuestbookPageClient items={items} />
      </>
    </PublicPageShell>
  );
}
