import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { GuestbookPageClient } from "@/components/public/pages/GuestbookPageClient";
import { PageTitleBand } from "@/components/public/pages/PageTitleBand";
import { GUESTBOOK_ITEMS } from "@/lib/public-pages-data";

export const metadata: Metadata = {
  title: "Livre d'or — Paris Greeters",
};

export default async function LivreDorPage() {
  return (
    <PublicPageShell testId="livre-dor-public-page">
      <PageTitleBand title="Livre d'or" testId="livre-dor-public-page-title" />
      <GuestbookPageClient items={GUESTBOOK_ITEMS} />
    </PublicPageShell>
  );
}