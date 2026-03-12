import type { Metadata } from "next";

import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { HomePage } from "@/components/public/home/HomePage";
import { Footer } from "@/components/public/layout/Footer";
import { Header } from "@/components/public/layout/Header";
import { TopBar } from "@/components/public/layout/TopBar";
import { ChatBotLoader } from "@/components/chatbot/ChatBotLoader";
import { getRequestLocale } from "@/lib/i18n/request";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("/", {
    title: "Paris Greeters — Balades gratuites avec un local",
    description: "Découvrez Paris autrement avec les Greeters : des balades gratuites, humaines et locales au cœur de la ville.",
  });
}

export default async function Home() {
  const locale = await getRequestLocale();
  const homepage = await findPublicPageBySlug("/", locale).catch(() => null);

  return (
    <main className="min-h-screen flex flex-col bg-white" data-testid="public-home-page">
      <TopBar initialLocale={locale} />
      <Header currentPath="/" />
      <StructuredDataScript
        page={homepage ?? { title: "Paris Greeters", slug: "/", metaDescription: "Découvrez Paris autrement avec les Greeters : des balades gratuites, humaines et locales au cœur de la ville." }}
        locale={locale}
        path="/"
      />
      <HomePage locale={locale} />
      <Footer currentPath="/" />
      <ChatBotLoader />
    </main>
  );
}
