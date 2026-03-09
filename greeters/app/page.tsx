import Link from "next/link";

import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { Footer } from "@/components/public/layout/Footer";
import { Header } from "@/components/public/layout/Header";
import { TopBar } from "@/components/public/layout/TopBar";
import { findPublicPageBySlug } from "@/lib/services/pages";

const NEXT_STEPS = [
  {
    key: "repositories",
    title: "Repositories métier",
    description: "Les accès Prisma sont maintenant structurés pour le portage progressif des domaines utilisateurs, pages, versions et menu.",
  },
  {
    key: "apis",
    title: "APIs pages P0",
    description: "CRUD, lecture publique, validations, historique et rollback forment un premier socle exploitable côté CMS.",
  },
  {
    key: "shells",
    title: "Shell admin/public",
    description: "Une vraie enveloppe d’interface encadre désormais l’accueil public et l’espace admin pour accélérer les prochains lots.",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const homepage = await findPublicPageBySlug("/").catch(() => null);

  if (homepage) {
    return (
      <main className="public-page" data-testid="public-home-page-live">
        <TopBar />
        <Header />
        <div className="public-live-page" data-testid="public-home-live-content">
          <DynamicPageRenderer page={homepage} />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="public-page" data-testid="public-home-page">
      <TopBar />
      <section className="landing-shell public-landing-shell" data-testid="public-home-shell">
        <div className="hero-panel public-hero-panel" data-testid="public-home-hero-panel">
          <Header />

          <div className="public-hero-content" data-testid="public-home-hero-content">
            <span className="eyebrow" data-testid="public-home-eyebrow">
              Migration Greeters · Next.js App Router
            </span>
            <h2 className="hero-title" data-testid="public-home-title">
              La reprise du shell public et du CMS admin est engagée sur des bases métier plus solides.
            </h2>
            <p className="hero-copy" data-testid="public-home-description">
              Cette page d’accueil devient le point d’entrée du futur rendu SSR : navigation publique, CTA principal, structure éditoriale et passerelles vers l’administration.
            </p>

            <div className="public-hero-actions" data-testid="public-home-actions">
              <Link href="/admin" className="primary-button public-hero-button" data-testid="public-home-admin-link">
                Ouvrir l’admin
              </Link>
              <Link href="/admin/pages" className="secondary-button public-hero-button" data-testid="public-home-pages-link">
                Consulter les pages
              </Link>
            </div>
          </div>

          <div className="status-grid" data-testid="public-home-status-grid">
            {NEXT_STEPS.map((checkpoint) => (
              <article key={checkpoint.key} className="status-card" data-testid={`public-home-status-card-${checkpoint.key}`}>
                <p className="status-label" data-testid={`public-home-status-label-${checkpoint.key}`}>
                  {checkpoint.title}
                </p>
                <p className="status-description" data-testid={`public-home-status-description-${checkpoint.key}`}>
                  {checkpoint.description}
                </p>
              </article>
            ))}
          </div>

          <div className="hero-note" data-testid="public-home-note">
            Prochaine étape naturelle : brancher les pages publiques dynamiques et la synchronisation réelle du menu depuis le CMS.
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
