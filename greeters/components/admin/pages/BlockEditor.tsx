"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { PUBLIC_IMAGE_SIZES_ATTR } from "@/lib/media/config";

import type { EditorBlock, EditorSection } from "./editor-types";

export const BlockEditor = ({
  section,
  block,
  onChange,
  onDelete,
  onMove,
}: {
  section: EditorSection;
  block: EditorBlock;
  onChange: (updates: Partial<EditorBlock["content"]>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/images/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        detail?: string;
        image?: {
          src: string;
          width: string;
          height: string;
        };
      };

      if (!response.ok || !payload.image) {
        throw new Error(payload.detail ?? "Import impossible.");
      }

      onChange({
        src: payload.image.src,
        width: payload.image.width,
        height: payload.image.height,
        alt: block.content.alt || file.name.replace(/\.[^.]+$/, ""),
      });
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <article className="editor-card" data-testid={`page-editor-block-${block.id}`}>
      <div className="editor-card-header" data-testid={`page-editor-block-header-${block.id}`}>
        <div>
          <p className="status-label" data-testid={`page-editor-block-type-${block.id}`}>{block.type}</p>
          <p className="dashboard-row-meta" data-testid={`page-editor-block-parent-${block.id}`}>{section.name}</p>
        </div>
        <div className="dashboard-row-actions" data-testid={`page-editor-block-actions-${block.id}`}>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => onMove(-1)} data-testid={`page-editor-block-move-up-${block.id}`}>Monter</button>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => onMove(1)} data-testid={`page-editor-block-move-down-${block.id}`}>Descendre</button>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={onDelete} data-testid={`page-editor-block-delete-${block.id}`}>Supprimer</button>
        </div>
      </div>

      {block.type === "heading" ? (
        <div className="editor-grid" data-testid={`page-editor-block-fields-${block.id}`}>
          <label className="dashboard-field">
            <span data-testid={`page-editor-block-heading-text-label-${block.id}`}>Texte</span>
            <input value={block.content.text || ""} onChange={(event) => onChange({ text: event.target.value })} data-testid={`page-editor-block-heading-text-input-${block.id}`} />
          </label>
          <label className="dashboard-field">
            <span data-testid={`page-editor-block-heading-level-label-${block.id}`}>Niveau</span>
            <select value={block.content.level || "h2"} onChange={(event) => onChange({ level: event.target.value })} data-testid={`page-editor-block-heading-level-select-${block.id}`}>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
            </select>
          </label>
        </div>
      ) : null}

      {block.type === "text" ? (
        <label className="dashboard-field" data-testid={`page-editor-block-fields-${block.id}`}>
          <span data-testid={`page-editor-block-text-label-${block.id}`}>Contenu</span>
          <textarea rows={5} value={block.content.text || ""} onChange={(event) => onChange({ text: event.target.value })} data-testid={`page-editor-block-text-input-${block.id}`} />
        </label>
      ) : null}

      {block.type === "image" ? (
        <div className="editor-grid" data-testid={`page-editor-block-fields-${block.id}`}>
          <label className="dashboard-field dashboard-field-full">
            <span data-testid={`page-editor-block-image-src-label-${block.id}`}>URL image</span>
            <input value={block.content.src || ""} onChange={(event) => onChange({ src: event.target.value })} placeholder="https://..." data-testid={`page-editor-block-image-src-input-${block.id}`} />
          </label>
          <div className="dashboard-field dashboard-field-full">
            <span data-testid={`page-editor-block-image-upload-label-${block.id}`}>Importer une image</span>
            <div className="dashboard-row-actions">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)} data-testid={`page-editor-block-image-upload-input-${block.id}`} />
              <button type="button" className="secondary-button dashboard-inline-button" onClick={() => fileInputRef.current?.click()} disabled={uploading} data-testid={`page-editor-block-image-upload-button-${block.id}`}>{uploading ? "Import..." : "Uploader"}</button>
              <button type="button" className="secondary-button dashboard-inline-button" onClick={() => onChange({ src: "", alt: "", caption: "", width: "", height: "" })} data-testid={`page-editor-block-image-clear-button-${block.id}`}>Retirer l’image</button>
            </div>
          </div>
          <label className="dashboard-field">
            <span data-testid={`page-editor-block-image-alt-label-${block.id}`}>Texte alternatif</span>
            <input value={block.content.alt || ""} onChange={(event) => onChange({ alt: event.target.value })} data-testid={`page-editor-block-image-alt-input-${block.id}`} />
          </label>
          <label className="dashboard-field">
            <span data-testid={`page-editor-block-image-caption-label-${block.id}`}>Légende</span>
            <input value={block.content.caption || ""} onChange={(event) => onChange({ caption: event.target.value })} data-testid={`page-editor-block-image-caption-input-${block.id}`} />
          </label>
          {block.content.src ? (
            <div className="dashboard-field dashboard-field-full" data-testid={`page-editor-block-image-preview-${block.id}`}>
              <Image src={block.content.src} alt={block.content.alt || block.content.caption || "Aperçu image CMS"} width={Number(block.content.width) || 1200} height={Number(block.content.height) || 800} sizes={PUBLIC_IMAGE_SIZES_ATTR} className="site-illustration-image" />
            </div>
          ) : null}
        </div>
      ) : null}

      {block.type === "button" ? (
        <div className="editor-grid" data-testid={`page-editor-block-fields-${block.id}`}>
          <label className="dashboard-field">
            <span data-testid={`page-editor-block-button-text-label-${block.id}`}>Texte</span>
            <input value={block.content.text || ""} onChange={(event) => onChange({ text: event.target.value })} data-testid={`page-editor-block-button-text-input-${block.id}`} />
          </label>
          <label className="dashboard-field">
            <span data-testid={`page-editor-block-button-href-label-${block.id}`}>Lien</span>
            <input value={block.content.href || ""} onChange={(event) => onChange({ href: event.target.value })} data-testid={`page-editor-block-button-href-input-${block.id}`} />
          </label>
          <label className="dashboard-field dashboard-field-full">
            <span data-testid={`page-editor-block-button-style-label-${block.id}`}>Style</span>
            <select value={block.content.style || "primary"} onChange={(event) => onChange({ style: event.target.value })} data-testid={`page-editor-block-button-style-select-${block.id}`}>
              <option value="primary">Primaire</option>
              <option value="secondary">Secondaire</option>
              <option value="outline">Contour</option>
            </select>
          </label>
        </div>
      ) : null}
    </article>
  );
};