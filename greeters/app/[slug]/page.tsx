import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function PublicPlaceholderPage({ params }: PublicPlaceholderPageProps) {
  const { slug } = await params;
  const content = PUBLIC_PLACEHOLDERS[slug];

  if (!content) {
    notFound();
  }

  return (
    <main className="landing-shell" data-testid={`public-placeholder-page-${slug}`}>
      <section className="hero-panel" data-testid={`public-placeholder-panel-${slug}`}>
        <p className="eyebrow" data-testid={`public-placeholder-eyebrow-${slug}`}>
          Route publique préparée
        </p>
        <h1 className="hero-title" data-testid={`public-placeholder-title-${slug}`}>
          {content.title}
        </h1>
        <p className="hero-copy" data-testid={`public-placeholder-description-${slug}`}>
          {content.description}
        </p>
        <div className="public-hero-actions" data-testid={`public-placeholder-actions-${slug}`}>
          <Link href="/" className="secondary-button public-hero-button" data-testid={`public-placeholder-home-link-${slug}`}>
            Retour à l’accueil
          </Link>
          <Link href="/admin" className="primary-button public-hero-button" data-testid={`public-placeholder-admin-link-${slug}`}>
            Ouvrir l’admin
          </Link>
        </div>
      </section>
    </main>
  );
}