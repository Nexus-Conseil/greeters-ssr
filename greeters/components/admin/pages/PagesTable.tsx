"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";

import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n/config";

type PageItem = {
  id: string;
  locale: keyof typeof LOCALE_LABELS;
  title: string;
  slug: string;
  status: "draft" | "pending" | "published" | "archived";
  isInMenu: boolean;
  createdAt: string;
  updatedAt: string | null;
};

const STATUS_LABELS: Record<PageItem["status"], string> = {
  draft: "Brouillon",
  pending: "En attente",
  published: "Publié",
  archived: "Archivé",
};

export const PagesTable = () => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [localeFilter, setLocaleFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<PageItem | null>(null);

  async function fetchPages() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pages", { cache: "no-store" });
      const payload = (await response.json()) as PageItem[] | { detail?: string };

      if (!response.ok) {
        throw new Error("detail" in payload ? payload.detail ?? "Chargement impossible." : "Chargement impossible.");
      }

      setPages(payload as PageItem[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPages();
  }, []);

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesQuery =
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.slug.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      const matchesLocale = localeFilter === "all" || page.locale === localeFilter;
      return matchesQuery && matchesStatus && matchesLocale;
    });
  }, [localeFilter, pages, query, statusFilter]);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      const response = await fetch(`/api/pages/${deleteTarget.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { detail?: string };

      if (!response.ok) {
        throw new Error(payload.detail ?? "Suppression impossible.");
      }

      setPages((current) => current.filter((page) => page.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Suppression impossible.");
    }
  }

  return (
    <section className="dashboard-content" data-testid="admin-pages-page">
      <div className="dashboard-section-header" data-testid="admin-pages-header">
        <div>
          <p className="eyebrow" data-testid="admin-pages-eyebrow">
            Pages P0
          </p>
          <h1 className="admin-title" data-testid="admin-pages-title">
            Vue d’ensemble des pages migrées.
          </h1>
          <p className="admin-copy" data-testid="admin-pages-description">
            Cette vue s’appuie sur les nouvelles routes Next.js pour lister et piloter le contenu du site.
          </p>
        </div>
        <div className="dashboard-row-actions" data-testid="admin-pages-header-actions">
          <Link href="/admin/pages/new" className="primary-button dashboard-inline-button" data-testid="admin-pages-new-link">
            Nouvelle page
          </Link>
          <button className="secondary-button dashboard-inline-button" onClick={() => void fetchPages()} data-testid="admin-pages-refresh-button">
            Actualiser
          </button>
        </div>
      </div>

      <div className="dashboard-toolbar" data-testid="admin-pages-toolbar">
        <label className="dashboard-field" data-testid="admin-pages-search-field">
          <span data-testid="admin-pages-search-label">Recherche</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre ou slug"
            data-testid="admin-pages-search-input"
          />
        </label>

        <label className="dashboard-field" data-testid="admin-pages-status-field">
          <span data-testid="admin-pages-status-label">Statut</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            data-testid="admin-pages-status-select"
          >
            <option value="all">Tous</option>
            <option value="published">Publiés</option>
            <option value="pending">En attente</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </label>

        <label className="dashboard-field" data-testid="admin-pages-locale-field">
          <span data-testid="admin-pages-locale-label">Langue</span>
          <select
            value={localeFilter}
            onChange={(event) => setLocaleFilter(event.target.value)}
            data-testid="admin-pages-locale-select"
          >
            <option value="all">Toutes</option>
            {SUPPORTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>
                {LOCALE_LABELS[locale]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="dashboard-alert" data-testid="admin-pages-error-message">
          {error}
        </div>
      ) : null}

      <div className="dashboard-table-card" data-testid="admin-pages-table-card">
        {loading ? (
          <p className="dashboard-empty-state" data-testid="admin-pages-loading-state">
            Chargement des pages...
          </p>
        ) : filteredPages.length === 0 ? (
          <p className="dashboard-empty-state" data-testid="admin-pages-empty-state">
            Aucune page ne correspond aux filtres actuels.
          </p>
        ) : (
          <div className="dashboard-table" data-testid="admin-pages-table">
            {filteredPages.map((page) => (
              <article className="dashboard-row" key={page.id} data-testid={`admin-pages-row-${page.id}`}>
                <div data-testid={`admin-pages-row-main-${page.id}`}>
                  <p className="dashboard-row-title" data-testid={`admin-pages-row-title-${page.id}`}>
                    {page.title}
                  </p>
                  <p className="dashboard-row-meta" data-testid={`admin-pages-row-slug-${page.id}`}>
                    /{page.slug === "/" ? "" : page.slug}
                  </p>
                  <p className="dashboard-inline-note" data-testid={`admin-pages-row-locale-${page.id}`}>
                    {LOCALE_LABELS[page.locale]}
                  </p>
                </div>

                <div className="dashboard-row-status" data-testid={`admin-pages-row-status-block-${page.id}`}>
                  <span className={`dashboard-badge is-${page.status}`} data-testid={`admin-pages-row-status-${page.id}`}>
                    {STATUS_LABELS[page.status]}
                  </span>
                  {page.isInMenu ? (
                    <span className="dashboard-inline-note" data-testid={`admin-pages-row-menu-${page.id}`}>
                      Dans le menu
                    </span>
                  ) : null}
                </div>

                <div data-testid={`admin-pages-row-date-block-${page.id}`}>
                  <p className="dashboard-row-meta" data-testid={`admin-pages-row-date-${page.id}`}>
                    {new Date(page.updatedAt ?? page.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="dashboard-row-actions" data-testid={`admin-pages-row-actions-${page.id}`}>
                  <Link href={`/admin/pages/${page.id}` as Route} className="secondary-button dashboard-inline-button" data-testid={`admin-pages-edit-button-${page.id}`}>
                    Éditer
                  </Link>
                  {page.status === "published" ? (
                    <a
                      href={page.slug === "/" ? "/" : `/${page.slug}`}
                      className="secondary-button dashboard-inline-button"
                      target="_blank"
                      rel="noreferrer"
                      data-testid={`admin-pages-view-button-${page.id}`}
                    >
                      Voir
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="secondary-button dashboard-inline-button"
                    onClick={() => setDeleteTarget(page)}
                    data-testid={`admin-pages-delete-button-${page.id}`}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {deleteTarget ? (
        <div className="dashboard-modal-backdrop" data-testid="admin-pages-delete-modal">
          <div className="dashboard-modal" data-testid="admin-pages-delete-modal-panel">
            <h2 className="dashboard-modal-title" data-testid="admin-pages-delete-modal-title">
              Supprimer cette page ?
            </h2>
            <p className="dashboard-modal-copy" data-testid="admin-pages-delete-modal-description">
              {deleteTarget.title} sera supprimée ainsi que ses versions associées.
            </p>
            <div className="dashboard-modal-actions" data-testid="admin-pages-delete-modal-actions">
              <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setDeleteTarget(null)} data-testid="admin-pages-delete-cancel-button">
                Annuler
              </button>
              <button type="button" className="primary-button dashboard-inline-button" onClick={() => void handleDelete()} data-testid="admin-pages-delete-confirm-button">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};