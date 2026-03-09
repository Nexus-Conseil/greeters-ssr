"use client";

import { BlockEditor } from "./BlockEditor";
import { BACKGROUND_OPTIONS, BLOCK_TYPE_OPTIONS, LAYOUT_OPTIONS, type EditorBlockType, type EditorSection } from "./editor-types";

export const SectionEditor = ({
  section,
  expanded,
  onToggle,
  onChange,
  onDelete,
  onMove,
  onAddBlock,
  onBlockChange,
  onBlockDelete,
  onBlockMove,
}: {
  section: EditorSection;
  expanded: boolean;
  onToggle: () => void;
  onChange: (updates: Partial<EditorSection>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddBlock: (type: EditorBlockType) => void;
  onBlockChange: (blockId: string, updates: Partial<Record<string, string>>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockMove: (blockId: string, direction: -1 | 1) => void;
}) => {
  return (
    <section className="editor-panel" data-testid={`page-editor-section-${section.id}`}>
      <div className="editor-panel-header" data-testid={`page-editor-section-header-${section.id}`}>
        <button type="button" className="editor-panel-toggle" onClick={onToggle} data-testid={`page-editor-section-toggle-${section.id}`}>
          <span data-testid={`page-editor-section-name-${section.id}`}>{section.name}</span>
          <span data-testid={`page-editor-section-count-${section.id}`}>{section.blocks.length} bloc(s)</span>
        </button>
        <div className="dashboard-row-actions" data-testid={`page-editor-section-actions-${section.id}`}>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => onMove(-1)} data-testid={`page-editor-section-move-up-${section.id}`}>Monter</button>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => onMove(1)} data-testid={`page-editor-section-move-down-${section.id}`}>Descendre</button>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={onDelete} data-testid={`page-editor-section-delete-${section.id}`}>Supprimer</button>
        </div>
      </div>

      {expanded ? (
        <div className="editor-panel-body" data-testid={`page-editor-section-body-${section.id}`}>
          <div className="editor-grid">
            <label className="dashboard-field">
              <span data-testid={`page-editor-section-title-label-${section.id}`}>Nom</span>
              <input value={section.name} onChange={(event) => onChange({ name: event.target.value })} data-testid={`page-editor-section-title-input-${section.id}`} />
            </label>
            <label className="dashboard-field">
              <span data-testid={`page-editor-section-layout-label-${section.id}`}>Disposition</span>
              <select value={section.layout} onChange={(event) => onChange({ layout: event.target.value as EditorSection["layout"] })} data-testid={`page-editor-section-layout-select-${section.id}`}>
                {LAYOUT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="dashboard-field">
              <span data-testid={`page-editor-section-background-label-${section.id}`}>Fond</span>
              <select value={section.background} onChange={(event) => onChange({ background: event.target.value as EditorSection["background"] })} data-testid={`page-editor-section-background-select-${section.id}`}>
                {BACKGROUND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {section.background === "image" ? <label className="dashboard-field dashboard-field-full"><span data-testid={`page-editor-section-background-image-label-${section.id}`}>Image de fond</span><input value={section.backgroundImage || ""} onChange={(event) => onChange({ backgroundImage: event.target.value })} placeholder="https://..." data-testid={`page-editor-section-background-image-input-${section.id}`} /></label> : null}
          </div>

          <div className="editor-stack" data-testid={`page-editor-section-block-list-${section.id}`}>
            {section.blocks.map((block) => (
              <BlockEditor key={block.id} section={section} block={block} onChange={(updates) => onBlockChange(block.id, updates)} onDelete={() => onBlockDelete(block.id)} onMove={(direction) => onBlockMove(block.id, direction)} />
            ))}
          </div>

          <div className="dashboard-row-actions" data-testid={`page-editor-section-add-blocks-${section.id}`}>
            {BLOCK_TYPE_OPTIONS.map((option) => (
              <button type="button" className="secondary-button dashboard-inline-button" key={option.value} onClick={() => onAddBlock(option.value)} data-testid={`page-editor-section-add-${option.value}-${section.id}`}>
                Ajouter {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};