"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createEmptyBlock, createEmptyPage, createEmptySection, normalizePagePayload, slugifyTitle } from "./editor-utils";
import { PagePreviewModal } from "./PagePreviewModal";
import { SectionEditor } from "./SectionEditor";
import { VersionHistory } from "./VersionHistory";
import type { EditorPage, EditorSection } from "./editor-types";

function reorder<T extends { order: number }>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  return copy.map((item, order) => ({ ...item, order }));
}

function mergeStringRecord(base: Record<string, string>, updates: Partial<Record<string, string>>) {
  return Object.fromEntries(
    Object.entries({ ...base, ...updates }).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

export const PageEditorForm = ({ pageId }: { pageId?: string }) => {
  const router = useRouter();
  const [form, setForm] = useState<EditorPage>(createEmptyPage());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(pageId));
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(pageId));
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!pageId) return;
    let active = true;
    setLoading(true);
    fetch(`/api/pages/${pageId}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail ?? "Chargement impossible.");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        const normalized = normalizePagePayload(payload);
        setForm(normalized);
        setExpandedSectionId(normalized.sections[0]?.id ?? null);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pageId]);

  const canOpenHistory = useMemo(() => Boolean(pageId), [pageId]);

  function updateSection(sectionId: string, updater: (section: EditorSection) => EditorSection) {
    setForm((current) => ({ ...current, sections: current.sections.map((section) => (section.id === sectionId ? updater(section) : section)) }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(pageId ? `/api/pages/${pageId}` : "/api/pages", {
        method: pageId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Enregistrement impossible.");
      router.push("/admin/pages");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="dashboard-content" data-testid="page-editor-loading-state"><p className="dashboard-empty-state">Chargement de la page...</p></section>;

  return (
    <section className="dashboard-content" data-testid="page-editor-page">
      <div className="dashboard-section-header" data-testid="page-editor-header">
        <div>
          <p className="eyebrow" data-testid="page-editor-eyebrow">Éditeur de page</p>
          <h1 className="admin-title" data-testid="page-editor-title">{pageId ? "Modifier la page" : "Nouvelle page"}</h1>
          <p className="admin-copy" data-testid="page-editor-description">Créez vos sections, composez les blocs et préparez un rendu public SSR exploitable.</p>
        </div>
        <div className="dashboard-row-actions" data-testid="page-editor-header-actions">
          <Link href="/admin/pages" className="secondary-button dashboard-inline-button" data-testid="page-editor-back-link">Retour aux pages</Link>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setPreviewOpen(true)} data-testid="page-editor-preview-button">Prévisualiser</button>
          {canOpenHistory ? <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setHistoryOpen(true)} data-testid="page-editor-history-button">Historique</button> : null}
          <button type="button" className="primary-button dashboard-inline-button" onClick={() => void handleSubmit()} disabled={saving} data-testid="page-editor-save-button">{saving ? "Enregistrement..." : pageId ? "Mettre à jour" : "Créer la page"}</button>
        </div>
      </div>

      {error ? <div className="dashboard-alert" data-testid="page-editor-error-message">{error}</div> : null}

      <div className="editor-layout" data-testid="page-editor-layout">
        <div className="editor-main" data-testid="page-editor-main-column">
          <div className="editor-panel" data-testid="page-editor-basics-panel">
            <div className="editor-grid">
              <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-title-label">Titre</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: slugTouched ? current.slug : slugifyTitle(event.target.value) }))} data-testid="page-editor-title-input" /></label>
              <label className="dashboard-field"><span data-testid="page-editor-slug-label">Slug</span><input value={form.slug} onChange={(event) => { setSlugTouched(true); setForm((current) => ({ ...current, slug: slugifyTitle(event.target.value) })); }} data-testid="page-editor-slug-input" /></label>
              <label className="dashboard-field"><span data-testid="page-editor-status-label">Statut demandé</span><select value={form.status || "draft"} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EditorPage["status"] }))} data-testid="page-editor-status-select"><option value="draft">Brouillon</option><option value="pending">En attente</option><option value="published">Publié</option><option value="archived">Archivé</option></select></label>
              <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-meta-description-label">Description SEO</span><textarea rows={3} value={form.metaDescription} onChange={(event) => setForm((current) => ({ ...current, metaDescription: event.target.value }))} data-testid="page-editor-meta-description-input" /></label>
              <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-meta-keywords-label">Mots-clés SEO</span><input value={form.metaKeywords} onChange={(event) => setForm((current) => ({ ...current, metaKeywords: event.target.value }))} data-testid="page-editor-meta-keywords-input" /></label>
            </div>
          </div>

          <div className="editor-section-stack" data-testid="page-editor-sections-stack">
            {form.sections.map((section, index) => (
              <SectionEditor
                key={section.id}
                section={section}
                expanded={expandedSectionId === section.id}
                onToggle={() => setExpandedSectionId((current) => (current === section.id ? null : section.id))}
                onChange={(updates) => updateSection(section.id, (current) => ({ ...current, ...updates }))}
                onDelete={() => setForm((current) => ({ ...current, sections: current.sections.filter((item) => item.id !== section.id).map((item, order) => ({ ...item, order })) }))}
                onMove={(direction) => setForm((current) => ({ ...current, sections: reorder(current.sections, index, direction) }))}
                onAddBlock={(type) => updateSection(section.id, (current) => ({ ...current, blocks: [...current.blocks, createEmptyBlock(type, current.blocks.length)] }))}
                onBlockChange={(blockId, updates) => updateSection(section.id, (current) => ({ ...current, blocks: current.blocks.map((block) => (block.id === blockId ? { ...block, content: mergeStringRecord(block.content, updates) } : block)) }))}
                onBlockDelete={(blockId) => updateSection(section.id, (current) => ({ ...current, blocks: current.blocks.filter((block) => block.id !== blockId).map((block, order) => ({ ...block, order })) }))}
                onBlockMove={(blockId, direction) => updateSection(section.id, (current) => ({ ...current, blocks: reorder(current.blocks, current.blocks.findIndex((block) => block.id === blockId), direction) }))}
              />
            ))}
          </div>

          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => { const section = createEmptySection(form.sections.length); setForm((current) => ({ ...current, sections: [...current.sections, section] })); setExpandedSectionId(section.id); }} data-testid="page-editor-add-section-button">Ajouter une section</button>
        </div>

        <aside className="editor-sidebar" data-testid="page-editor-sidebar">
          <div className="editor-panel" data-testid="page-editor-menu-panel">
            <label className="editor-checkbox-row" data-testid="page-editor-menu-checkbox-row"><input type="checkbox" checked={form.isInMenu} onChange={(event) => setForm((current) => ({ ...current, isInMenu: event.target.checked }))} data-testid="page-editor-menu-checkbox" /><span data-testid="page-editor-menu-checkbox-label">Afficher dans le menu public</span></label>
            {form.isInMenu ? <div className="editor-grid"><label className="dashboard-field"><span data-testid="page-editor-menu-label-label">Libellé menu</span><input value={form.menuLabel} onChange={(event) => setForm((current) => ({ ...current, menuLabel: event.target.value }))} data-testid="page-editor-menu-label-input" /></label><label className="dashboard-field"><span data-testid="page-editor-menu-order-label">Ordre menu</span><input type="number" value={form.menuOrder} onChange={(event) => setForm((current) => ({ ...current, menuOrder: Number(event.target.value) || 0 }))} data-testid="page-editor-menu-order-input" /></label></div> : null}
          </div>
          <div className="editor-panel" data-testid="page-editor-summary-panel">
            <p className="status-label" data-testid="page-editor-summary-label">Résumé</p>
            <p className="dashboard-row-title" data-testid="page-editor-summary-title">{form.title || "Page sans titre"}</p>
            <p className="dashboard-row-meta" data-testid="page-editor-summary-slug">/{form.slug || "nouvelle-page"}</p>
            <p className="dashboard-row-meta" data-testid="page-editor-summary-sections">{form.sections.length} section(s) · {form.sections.reduce((total, section) => total + section.blocks.length, 0)} bloc(s)</p>
          </div>
        </aside>
      </div>

      {previewOpen ? <PagePreviewModal page={form} title={form.title || "Prévisualisation"} onClose={() => setPreviewOpen(false)} /> : null}
      {historyOpen && pageId ? <VersionHistory pageId={pageId} onClose={() => setHistoryOpen(false)} onRollback={() => router.refresh()} /> : null}
    </section>
  );
};