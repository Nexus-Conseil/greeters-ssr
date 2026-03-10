import type { Metadata } from "next";
import Image from "next/image";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { PUBLIC_IMAGE_SIZES_ATTR } from "@/lib/media/config";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
import { VOLUNTEER_BENEFITS, VOLUNTEER_REQUIREMENTS } from "@/lib/public-pages-data";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata("devenez-benevole", {
    title: "Devenez bénévole — Paris Greeters",
    description: "Rejoignez Paris Greeters et partagez votre passion pour la ville avec des visiteurs du monde entier.",
  });
}

export default async function DevenezBenevolePage() {
  const locale = await getRequestLocale();
  const title = getLocalizedPageTitle(locale, "devenez-benevole");
  const seoPage = await findPublicPageBySlug("devenez-benevole", locale).catch(() => null);

  return (
    <PublicPageShell testId="devenez-benevole-public-page">
      <>
          <StructuredDataScript page={seoPage ?? { title, slug: "devenez-benevole", metaDescription: "Devenir bénévole Paris Greeters" }} locale={locale} path="devenez-benevole" />
          {seoPage ? <div className="site-container site-content-section" data-testid="devenez-benevole-public-page-cms-content"><DynamicPageRenderer page={seoPage} /></div> : <>
          <section className="site-title-band site-title-band-hero" data-testid="devenez-benevole-hero-band">
            <div className="site-container site-centered-stack">
              <h1 className="site-title-band-heading" data-testid="devenez-benevole-title">{title}</h1>
              <p className="site-title-band-subtitle" data-testid="devenez-benevole-subtitle">Partagez votre passion pour Paris avec des visiteurs du monde entier</p>
            </div>
          </section>

          <div className="site-container site-content-section" data-testid="devenez-benevole-public-page-content">
            <div className="site-overlap-image-card" data-testid="devenez-benevole-image-card">
              <Image src="/images/uploads/devenez-benevole.png" alt="Devenez bénévole Greeter" width={1200} height={630} sizes={PUBLIC_IMAGE_SIZES_ATTR} className="site-illustration-image" data-testid="devenez-benevole-image" />
            </div>

            <section className="site-block-stack" data-testid="devenez-benevole-intro-section">
              <h2 className="site-section-subtitle">Rejoignez notre équipe</h2>
              <div className="site-copy-stack">
                <p>Les Greeters sont des habitants qui font découvrir gratuitement leur quartier, leur ville ou leur région à des visiteurs venus du monde entier. Ce sont des rencontres uniques, authentiques et chaleureuses.</p>
                <p>En devenant Greeter, vous partagez votre amour de Paris et créez des liens avec des personnes de cultures différentes. C'est une expérience enrichissante qui vous permet de redécouvrir votre propre ville à travers les yeux de vos visiteurs.</p>
              </div>
            </section>

            <section className="site-feature-grid site-feature-grid-2" data-testid="devenez-benevole-benefits-grid">
              {VOLUNTEER_BENEFITS.map((item) => (
                <article key={item.id} className="site-feature-card" data-testid={`devenez-benevole-benefit-${item.id}`}>
                  <h3 className="site-card-title">{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </section>

            <section className="site-soft-panel" data-testid="devenez-benevole-requirements-panel">
              <h2 className="site-section-subtitle">Pour devenir Greeter, il vous faut :</h2>
              <ul className="site-bullet-list" data-testid="devenez-benevole-requirements-list">
                {VOLUNTEER_REQUIREMENTS.map((item, index) => (
                  <li key={item} data-testid={`devenez-benevole-requirement-${index}`}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="site-centered-stack" data-testid="devenez-benevole-cta-section">
              <p>Intéressé(e) ? Rejoignez notre communauté de bénévoles passionnés !</p>
              <a href="https://docs.google.com/forms/d/1R4Q85pNX60rDTLkwO24WYH6nAH2VEd13SvfAEVzgLd0/viewform" target="_blank" rel="noreferrer" className="site-cta-button" data-testid="devenez-benevole-cta-link">Postuler pour devenir Greeter</a>
            </section>
          </div>
          </>}
      </>
    </PublicPageShell>
  );
}