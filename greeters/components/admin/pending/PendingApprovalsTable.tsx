"use client";

import { useEffect, useState } from "react";

type PendingItem = {
  versionId: string;
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  versionNumber: number;
  editorName: string;
  editorEmail: string;
  createdAt: string;
  currentContent: {
    title: string;
    slug: string;
    sections: Array<unknown>;
  } | null;
  pendingContent: {
    title: string;
    slug: string;
    sections: Array<unknown>;
  };
};

export const PendingApprovalsTable = () => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  async function fetchPending() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pages/pending/list", { cache: "no-store" });
      const payload = (await response.json()) as PendingItem[] | { detail?: string };

      if (!response.ok) {
        throw new Error("detail" in payload ? payload.detail ?? "Chargement impossible." : "Chargement impossible.");
      }

      setItems(payload as PendingItem[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPending();
  }, []);

  async function handleApprove(versionId: string) {
    const response = await fetch(`/api/pages/pending/${versionId}/approve`, { method: "POST" });
    const payload = (await response.json()) as { detail?: string };

    if (!response.ok) {
      throw new Error(payload.detail ?? "Approbation impossible.");
    }
  }

  async function handleReject(versionId: string) {
    const response = await fetch(`/api/pages/pending/${versionId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason[versionId] ?? "" }),
    });
    const payload = (await response.json()) as { detail?: string };

    if (!response.ok) {
      throw new Error(payload.detail ?? "Rejet impossible.");
    }
  }

  async function runAction(action: () => Promise<void>) {
    setError("");

    try {
      await action();
      await fetchPending();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action impossible.");
    }
  }

  return (
    <section className="dashboard-content" data-testid="admin-pending-page">
      <div className="dashboard-section-header" data-testid="admin-pending-header">
        <div>
          <p className="eyebrow" data-testid="admin-pending-eyebrow">
            Validations
          </p>
          <h1 className="admin-title" data-testid="admin-pending-title">
            Versions en attente d’approbation.
          </h1>
          <p className="admin-copy" data-testid="admin-pending-description">
            Cette vue connecte les nouvelles routes d’approbation au futur workflow éditorial du CMS.
          </p>
        </div>
        <button className="secondary-button dashboard-inline-button" onClick={() => void fetchPending()} data-testid="admin-pending-refresh-button">
          Actualiser
        </button>
      </div>

      {error ? (
        <div className="dashboard-alert" data-testid="admin-pending-error-message">
          {error}
        </div>
      ) : null}

      <div className="dashboard-table-card" data-testid="admin-pending-table-card">
        {loading ? (
          <p className="dashboard-empty-state" data-testid="admin-pending-loading-state">
            Chargement des validations...
          </p>
        ) : items.length === 0 ? (
          <p className="dashboard-empty-state" data-testid="admin-pending-empty-state">
            Aucune validation en attente pour le moment.
          </p>
        ) : (
          <div className="dashboard-table" data-testid="admin-pending-table">
            {items.map((item) => {
              const isExpanded = expandedId === item.versionId;

              return (
                <article className="dashboard-row is-stack" key={item.versionId} data-testid={`admin-pending-row-${item.versionId}`}>
                  <div className="dashboard-row-head" data-testid={`admin-pending-head-${item.versionId}`}>
                    <div>
                      <p className="dashboard-row-title" data-testid={`admin-pending-title-${item.versionId}`}>
                        {item.pageTitle}
                      </p>
                      <p className="dashboard-row-meta" data-testid={`admin-pending-meta-${item.versionId}`}>
                        /{item.pageSlug === "/" ? "" : item.pageSlug} · v{item.versionNumber} · {item.editorName}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary-button dashboard-inline-button"
                      onClick={() => setExpandedId(isExpanded ? null : item.versionId)}
                      data-testid={`admin-pending-toggle-button-${item.versionId}`}
                    >
                      {isExpanded ? "Réduire" : "Détails"}
                    </button>
                  </div>

                  <p className="dashboard-row-meta" data-testid={`admin-pending-date-${item.versionId}`}>
                    Soumise le {new Date(item.createdAt).toLocaleString("fr-FR")} par {item.editorEmail}
                  </p>

                  {isExpanded ? (
                    <div className="dashboard-compare-grid" data-testid={`admin-pending-details-${item.versionId}`}>
                      <div className="dashboard-compare-card" data-testid={`admin-pending-current-card-${item.versionId}`}>
                        <p className="status-label" data-testid={`admin-pending-current-label-${item.versionId}`}>
                          Version publiée
                        </p>
                        <p className="dashboard-row-title" data-testid={`admin-pending-current-title-${item.versionId}`}>
                          {item.currentContent?.title ?? "Nouvelle page"}
                        </p>
                        <p className="dashboard-row-meta" data-testid={`admin-pending-current-sections-${item.versionId}`}>
                          Sections : {item.currentContent?.sections.length ?? 0}
                        </p>
                      </div>

                      <div className="dashboard-compare-card is-highlight" data-testid={`admin-pending-next-card-${item.versionId}`}>
                        <p className="status-label" data-testid={`admin-pending-next-label-${item.versionId}`}>
                          Version soumise
                        </p>
                        <p className="dashboard-row-title" data-testid={`admin-pending-next-title-${item.versionId}`}>
                          {item.pendingContent.title}
                        </p>
                        <p className="dashboard-row-meta" data-testid={`admin-pending-next-sections-${item.versionId}`}>
                          Sections : {item.pendingContent.sections.length}
                        </p>
                      </div>

                      <label className="dashboard-field dashboard-field-full" data-testid={`admin-pending-reject-field-${item.versionId}`}>
                        <span data-testid={`admin-pending-reject-label-${item.versionId}`}>Motif de rejet</span>
                        <textarea
                          value={rejectReason[item.versionId] ?? ""}
                          onChange={(event) =>
                            setRejectReason((current) => ({
                              ...current,
                              [item.versionId]: event.target.value,
                            }))
                          }
                          rows={3}
                          data-testid={`admin-pending-reject-input-${item.versionId}`}
                        />
                      </label>

                      <div className="dashboard-row-actions" data-testid={`admin-pending-actions-${item.versionId}`}>
                        <button
                          type="button"
                          className="secondary-button dashboard-inline-button"
                          onClick={() => void runAction(() => handleReject(item.versionId))}
                          data-testid={`admin-pending-reject-button-${item.versionId}`}
                        >
                          Rejeter
                        </button>
                        <button
                          type="button"
                          className="primary-button dashboard-inline-button"
                          onClick={() => void runAction(() => handleApprove(item.versionId))}
                          data-testid={`admin-pending-approve-button-${item.versionId}`}
                        >
                          Approuver
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};