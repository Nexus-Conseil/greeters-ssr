import Link from "next/link";
import type { Route } from "next";

const DASHBOARD_CARDS = [
  {
    key: "repositories",
    title: "Repositories métier",
    description: "Base Prisma centralisée pour users, sessions, pages, versions, menu, documents et home sections.",
    href: "/admin/pages",
    cta: "Voir les pages",
  },
  {
    key: "workflow",
    title: "Workflow d’approbation",
    description: "Routes API prêtes pour les brouillons éditeur, validations admin et rollback de versions.",
    href: "/admin/pending",
    cta: "Ouvrir les validations",
  },
  {
    key: "public-shell",
    title: "Shell public",
    description: "Enveloppe publique posée pour la future migration SSR des pages et composants de contenu.",
    href: "/",
    cta: "Voir l’accueil",
  },
];

export const AdminDashboard = () => {
  return (
    <main className="dashboard-content" data-testid="admin-dashboard-page">
      <section className="dashboard-hero" data-testid="admin-dashboard-hero">
        <p className="eyebrow" data-testid="admin-dashboard-eyebrow">
          Lot 03 → 05 en cours
        </p>
        <h1 className="admin-title" data-testid="admin-dashboard-title">
          Le shell admin peut maintenant piloter le portage des pages Greeters.
        </h1>
        <p className="admin-copy" data-testid="admin-dashboard-description">
          Les fondations métier, les routes pages P0 et les premiers écrans de navigation sont alignés pour accélérer la suite du CMS.
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