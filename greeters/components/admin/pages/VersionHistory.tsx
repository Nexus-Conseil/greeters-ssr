"use client";

import { useEffect, useState } from "react";

import { PagePreviewModal } from "./PagePreviewModal";
import type { VersionItem } from "./editor-types";

export const VersionHistory = ({ pageId, onClose, onRollback }: { pageId: string; onClose: () => void; onRollback: () => void }) => {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<VersionItem | null>(null);

  async function loadVersions() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/pages/${pageId}/versions?limit=10`, { cache: "no-store" });
      const payload = (await response.json()) as VersionItem[] | { detail?: string };
      if (!response.ok) {
        throw new Error("detail" in payload ? payload.detail ?? "Chargement impossible." : "Chargement impossible.");
      }
      setVersions(payload as VersionItem[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVersions();
  }, [pageId]);

  async function handleRollback(versionNumber: number) {
    const response = await fetch(`/api/pages/${pageId}/rollback/${versionNumber}`, { method: "POST" });
    const payload = (await response.json()) as { detail?: string };
    if (!response.ok) {
      setError(payload.detail ?? "Restauration impossible.");
      return;
    }
    onRollback();
    onClose();
  }

  return (
    <>
      <div className="dashboard-modal-backdrop" data-testid="version-history-modal">
        <div className="dashboard-modal version-history-modal" data-testid="version-history-panel">
          <div className="dashboard-section-header" data-testid="version-history-header">
            <div>
              <p className="status-label" data-testid="version-history-label">Historique</p>
              <h2 className="dashboard-modal-title" data-testid="version-history-title">Versions récentes</h2>
            </div>
            <button type="button" className="secondary-button dashboard-inline-button" onClick={onClose} data-testid="version-history-close-button">Fermer</button>
          </div>
          {error ? <div className="dashboard-alert" data-testid="version-history-error-message">{error}</div> : null}
          {loading ? <p className="dashboard-empty-state" data-testid="version-history-loading-state">Chargement...</p> : null}
          {!loading && versions.length === 0 ? <p className="dashboard-empty-state" data-testid="version-history-empty-state">Aucune version disponible.</p> : null}
          <div className="dashboard-table" data-testid="version-history-list">
            {versions.map((version) => (
              <article className="dashboard-row is-stack" key={version.id} data-testid={`version-history-item-${version.id}`}>
                <div className="dashboard-row-head">
                  <div>
                    <p className="dashboard-row-title" data-testid={`version-history-item-title-${version.id}`}>Version {version.versionNumber}</p>
                    <p className="dashboard-row-meta" data-testid={`version-history-item-meta-${version.id}`}>{version.createdByName} · {new Date(version.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <span className={`dashboard-badge is-${version.status}`} data-testid={`version-history-item-status-${version.id}`}>{version.isPublished ? "Publiée" : version.isCurrent ? "Actuelle" : version.status}</span>
                </div>
                <div className="dashboard-row-actions" data-testid={`version-history-item-actions-${version.id}`}>
                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setPreview(version)} data-testid={`version-history-preview-button-${version.id}`}>Prévisualiser</button>
                  {!version.isPublished ? <button type="button" className="primary-button dashboard-inline-button" onClick={() => void handleRollback(version.versionNumber)} data-testid={`version-history-rollback-button-${version.id}`}>Restaurer</button> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      {preview ? <PagePreviewModal page={preview.content} title={`Version ${preview.versionNumber}`} onClose={() => setPreview(null)} /> : null}
    </>
  );
};