"use client";

import type { EditorPage } from "./editor-types";
import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";

export const PagePreviewModal = ({ page, title, onClose }: { page: EditorPage; title: string; onClose: () => void }) => {
  return (
    <div className="dashboard-modal-backdrop" data-testid="page-preview-modal">
      <div className="page-preview-shell" data-testid="page-preview-shell">
        <div className="page-preview-header" data-testid="page-preview-header">
          <div>
            <p className="status-label" data-testid="page-preview-label">
              Prévisualisation
            </p>
            <h2 className="dashboard-modal-title" data-testid="page-preview-title">
              {title}
            </h2>
            <p className="dashboard-row-meta" data-testid="page-preview-slug">
              /{page.slug || ""}
            </p>
          </div>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={onClose} data-testid="page-preview-close-button">
            Fermer
          </button>
        </div>
        <div className="editor-grid" data-testid="page-preview-seo-summary-grid">
          <div className="editor-image-seo-card" data-testid="page-preview-google-snippet-card">
            <p className="status-label">Aperçu Google</p>
            <p className="dashboard-row-meta">{page.canonicalUrl || `https://greeters.paris/${page.slug || ""}`}</p>
            <p className="dashboard-row-title">{page.metaTitle || page.title}</p>
            <p className="dashboard-row-meta">{page.metaDescription || "Ajoutez une meta description pour enrichir le résultat de recherche."}</p>
          </div>
          <div className="editor-image-seo-card" data-testid="page-preview-social-card">
            <p className="status-label">Aperçu social</p>
            <p className="dashboard-row-title">{page.ogTitle || page.metaTitle || page.title}</p>
            <p className="dashboard-row-meta">{page.ogDescription || page.metaDescription || "Ajoutez une description Open Graph."}</p>
            <p className="dashboard-row-meta">Robots : {page.robotsDirective || "index,follow"}</p>
          </div>
        </div>
        <div className="page-preview-content" data-testid="page-preview-content">
          <DynamicPageRenderer page={page} />
        </div>
      </div>
    </div>
  );
};