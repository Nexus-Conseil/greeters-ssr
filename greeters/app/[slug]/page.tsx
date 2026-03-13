import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { Footer } from "@/components/public/layout/Footer";
import { Header } from "@/components/public/layout/Header";
import { TopBar } from "@/components/public/layout/TopBar";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { buildSeoMetadata } from "@/lib/seo/page-seo";
import { findPublicPageBySlug } from "@/lib/services/pages";

const PUBLIC_PLACEHOLDERS: Record<string, { title: string; description: string }> = {
  galerie: {
    title: "Galerie",
    description: "Cette route publique est réservée pour le prochain portage SSR des contenus médias et visuels.",
  },
  "livre-dor": {
    title: "Livre d’or",
    description: "La page publique sera reconnectée lors du portage des sections CMS et des contenus visiteurs.",
  },
  actualites: {
    title: "Actualités",
    description: "Le shell public est prêt à accueillir la future liste des actualités et leurs fiches dynamiques.",
  },
  contact: {
    title: "Contact",
    description: "Le formulaire et les flux de contact seront branchés dans le prochain lot métier.",
  },
  "qui-sommes-nous": {
    title: "Qui sommes-nous",
    description: "Le contenu institutionnel pourra être porté ensuite dans la future route CMS dynamique.",
  },
  "devenez-benevole": {
    title: "Devenez bénévole",
    description: "La structure d’accueil est prête pour recevoir les futures sections éditoriales de recrutement.",
  },
  presse: {
    title: "Presse",
    description: "Cette page sera alimentée au fur et à mesure du portage des contenus documentaires et éditoriaux.",
  },
  "mentions-legales": {
    title: "Mentions légales",
    description: "Le shell public réserve déjà l’emplacement pour les contenus réglementaires finaux.",
  },
};

type PublicPlaceholderPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PublicPlaceholderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const livePage = await findPublicPageBySlug(slug, locale).catch(() => null);
  const currentPath = livePage?.slug?.startsWith("/") ? livePage.slug : `/${slug}`;
  const content = PUBLIC_PLACEHOLDERS[slug];

  if (livePage) {
    return buildSeoMetadata(livePage, locale, {
      title: livePage.title,
      description: livePage.metaDescription || livePage.title,
      path: livePage.slug,
    });
  }

  return buildSeoMetadata({ slug, title: content?.title ?? slug, metaDescription: content?.description ?? slug }, locale, {
    title: content?.title ?? slug,
    description: content?.description ?? slug,
    path: slug,
  });
}

export default async function PublicPlaceholderPage({ params }: PublicPlaceholderPageProps) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const livePage = await findPublicPageBySlug(slug, locale).catch(() => null);
  const currentPath = livePage?.slug?.startsWith("/") ? livePage.slug : `/${slug}`;

  if (livePage) {
    return (
      <main className="site-page" data-testid={`public-live-page-${slug}`}>
        <TopBar initialLocale={locale} />
        <Header currentPath={currentPath} />
        <StructuredDataScript page={livePage} locale={locale} path={livePage.slug} />
        <div className="site-live-page" data-testid={`public-live-page-content-${slug}`}>
          <DynamicPageRenderer page={livePage} />
        </div>
        <Footer currentPath={currentPath} />
      </main>
    );
  }

  const content = PUBLIC_PLACEHOLDERS[slug];

  if (!content) {
    notFound();
  }

  return (
    <main className="site-page" data-testid={`public-placeholder-page-${slug}`}>
      <TopBar initialLocale={locale} />
      <Header currentPath={currentPath} />
      <StructuredDataScript page={{ title: content.title, slug, metaDescription: content.description }} locale={locale} path={slug} />
      <section className="site-static-shell" data-testid={`public-placeholder-shell-${slug}`}>
        <section className="site-static-card" data-testid={`public-placeholder-panel-${slug}`}>
          <p className="site-static-eyebrow" data-testid={`public-placeholder-eyebrow-${slug}`}>
            Route publique préparée
          </p>
          <h1 className="site-static-title" data-testid={`public-placeholder-title-${slug}`}>
            {content.title}
          </h1>
          <p className="site-static-description" data-testid={`public-placeholder-description-${slug}`}>
            {content.description}
          </p>
          <div className="site-static-actions" data-testid={`public-placeholder-actions-${slug}`}>
            <Link href="/" className="site-outline-link" data-testid={`public-placeholder-home-link-${slug}`}>
              Retour à l’accueil
            </Link>
            <Link href="/admin" className="site-cta-button" data-testid={`public-placeholder-admin-link-${slug}`}>
              Ouvrir l’admin
            </Link>
          </div>
        </section>
      </section>
      <Footer currentPath={currentPath} />
    </main>
  );
}