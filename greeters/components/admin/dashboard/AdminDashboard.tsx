import Link from "next/link";
import type { Route } from "next";

const DASHBOARD_CARDS = [
  {
    key: "repositories",
    title: "Pages & contenu public",
    description: "Éditez les pages publiées, préremplissez le site public et vérifiez les statuts par langue.",
    href: "/admin/pages",
    cta: "Voir les pages",
  },
  {
    key: "workflow",
    title: "Workflow d’approbation",
    description: "Validez les nouvelles versions, suivez les soumissions en attente et restaurez une version publiée si nécessaire.",
    href: "/admin/pending",
    cta: "Ouvrir les validations",
  },
  {
    key: "public-shell",
    title: "Menu & rendu public",
    description: "Contrôlez la navigation publique, les variantes multilingues et le rendu du site visible par les visiteurs.",
    href: "/",
    cta: "Voir l’accueil",
  },
];

export const AdminDashboard = () => {
  return (
    <main className="dashboard-content" data-testid="admin-dashboard-page">
      <section className="dashboard-hero" data-testid="admin-dashboard-hero">
        <p className="eyebrow" data-testid="admin-dashboard-eyebrow">
          CMS Greeters opérationnel
        </p>
        <h1 className="admin-title" data-testid="admin-dashboard-title">
          Le back-office pilote maintenant les pages, le menu et les validations du site public.
        </h1>
        <p className="admin-copy" data-testid="admin-dashboard-description">
          Utilisez cet espace pour publier les contenus par langue, synchroniser la navigation et suivre les évolutions éditoriales du site Greeters.
        </p>
      </section>

      <section className="dashboard-card-grid" data-testid="admin-dashboard-card-grid">
        {DASHBOARD_CARDS.map((card) => (
          <article className="dashboard-card" key={card.key} data-testid={`admin-dashboard-card-${card.key}`}>
            <p className="status-label" data-testid={`admin-dashboard-card-label-${card.key}`}>
              {card.title}
            </p>
            <p className="dashboard-card-copy" data-testid={`admin-dashboard-card-description-${card.key}`}>
              {card.description}
            </p>
            <Link href={card.href as Route} className="secondary-button dashboard-inline-button" data-testid={`admin-dashboard-card-link-${card.key}`}>
              {card.cta}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
};