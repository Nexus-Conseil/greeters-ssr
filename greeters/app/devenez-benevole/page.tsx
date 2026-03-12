import type { Metadata } from "next";
import Image from "next/image";
import { Users, Heart, MapPin, Clock } from "lucide-react";

import { PublicPageShell } from "@/components/public/layout/PublicPageShell";
import { StructuredDataScript } from "@/components/seo/StructuredDataScript";
import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedPageTitle } from "@/lib/i18n/site-copy";
import { getRouteMetadata } from "@/lib/seo/public-metadata";
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

        {/* Hero Section */}
        <div className="bg-[#558b2f] py-16 text-white" data-testid="devenez-benevole-hero-band">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="devenez-benevole-title">
              Devenez Greeter bénévole
            </h1>
            <p className="text-lg opacity-90" data-testid="devenez-benevole-subtitle">
              Partagez votre passion pour Paris avec des visiteurs du monde entier
            </p>
          </div>
        </div>

        {/* Image de présentation */}
        <div className="max-w-4xl mx-auto px-4 -mt-8 mb-8" data-testid="devenez-benevole-image-card">
          <Image
            src="/images/uploads/devenez-benevole.png"
            alt="Devenez bénévole Greeter"
            width={1200}
            height={630}
            className="w-full rounded-lg shadow-lg"
            data-testid="devenez-benevole-image"
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12" data-testid="devenez-benevole-content">
          {/* Introduction */}
          <div className="mb-12" data-testid="devenez-benevole-intro-section">
            <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-4 text-center uppercase tracking-wider">
              Rejoignez notre équipe
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les Greeters sont des habitants qui font découvrir gratuitement leur quartier, leur ville ou leur région à des visiteurs venus du monde entier. Ce sont des rencontres uniques, authentiques et chaleureuses.
            </p>
            <p className="text-gray-600 leading-relaxed">
              En devenant Greeter, vous partagez votre amour de Paris et créez des liens avec des personnes de cultures différentes. C&apos;est une expérience enrichissante qui vous permet de redécouvrir votre propre ville à travers les yeux de vos visiteurs.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 gap-6 mb-12" data-testid="devenez-benevole-benefits-grid">
            <div className="bg-gray-50 rounded-lg p-6" data-testid="devenez-benevole-benefit-0">
              <Users className="w-8 h-8 text-[#558b2f] mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Rencontres enrichissantes</h3>
              <p className="text-gray-600 text-sm">Échangez avec des visiteurs venus des quatre coins du monde et découvrez leurs cultures.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6" data-testid="devenez-benevole-benefit-1">
              <Heart className="w-8 h-8 text-[#558b2f] mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Partagez votre passion</h3>
              <p className="text-gray-600 text-sm">Faites découvrir les lieux que vous aimez et les histoires qui vous passionnent.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6" data-testid="devenez-benevole-benefit-2">
              <MapPin className="w-8 h-8 text-[#558b2f] mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Redécouvrez votre quartier</h3>
              <p className="text-gray-600 text-sm">Voyez Paris avec un regard neuf en préparant vos balades et en les partageant.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6" data-testid="devenez-benevole-benefit-3">
              <Clock className="w-8 h-8 text-[#558b2f] mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Flexibilité totale</h3>
              <p className="text-gray-600 text-sm">Vous choisissez quand et combien de fois par mois vous souhaitez accueillir des visiteurs.</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-[#ededed] rounded-lg p-8 mb-12" data-testid="devenez-benevole-requirements-panel">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Pour devenir Greeter, il vous faut :</h2>
            <ul className="space-y-3 text-gray-600" data-testid="devenez-benevole-requirements-list">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-[#558b2f] rounded-full mt-2 flex-shrink-0"></span>
                <span>Habiter Paris ou sa proche banlieue depuis au moins un an</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-[#558b2f] rounded-full mt-2 flex-shrink-0"></span>
                <span>Aimer votre quartier et avoir envie de le faire découvrir</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-[#558b2f] rounded-full mt-2 flex-shrink-0"></span>
                <span>Parler au moins une langue étrangère (anglais, espagnol, allemand, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-[#558b2f] rounded-full mt-2 flex-shrink-0"></span>
                <span>Être disponible pour des balades de 2 à 3 heures</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-[#558b2f] rounded-full mt-2 flex-shrink-0"></span>
                <span>Avoir le goût du contact et de l&apos;échange</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center" data-testid="devenez-benevole-cta-section">
            <p className="text-gray-600 mb-6">Intéressé(e) ? Rejoignez notre communauté de bénévoles passionnés !</p>
            <a
              href="https://docs.google.com/forms/d/1R4Q85pNX60rDTLkwO24WYH6nAH2VEd13SvfAEVzgLd0/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#558b2f] hover:bg-[#33691e] text-white px-8 py-3 text-lg rounded-md transition-colors"
              data-testid="devenez-benevole-cta-link"
            >
              Postuler pour devenir Greeter
            </a>
          </div>
        </div>
      </>
    </PublicPageShell>
  );
}
