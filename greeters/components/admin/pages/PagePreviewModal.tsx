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
        <div className="page-preview-content" data-testid="page-preview-content">
          <DynamicPageRenderer page={page} />
        </div>
      </div>
    </div>
  );
};