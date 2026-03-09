import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { HomePage } from "@/components/public/home/HomePage";
import { Footer } from "@/components/public/layout/Footer";
import { Header } from "@/components/public/layout/Header";
import { TopBar } from "@/components/public/layout/TopBar";
import { getRequestLocale } from "@/lib/i18n/request";
import { findPublicPageBySlug } from "@/lib/services/pages";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getRequestLocale();
  const homepage = await findPublicPageBySlug("/", locale).catch(() => null);

  if (homepage) {
    return (
      <main className="site-page" data-testid="public-home-page-live">
        <TopBar />
        <Header />
        <div className="site-live-page" data-testid="public-home-live-content">
          <DynamicPageRenderer page={homepage} />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="site-page" data-testid="public-home-page">
      <TopBar />
      <Header />
      <HomePage locale={locale} />
      <Footer />
    </main>
  );
}
