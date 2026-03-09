"use client";

import { useEffect, useState } from "react";

import { DEFAULT_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";

type MenuItem = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  isVisible: boolean;
  order: number;
};

function createMenuItem(order: number): MenuItem {
  return {
    id: crypto.randomUUID(),
    label: "Nouveau lien",
    href: "/",
    isExternal: false,
    isVisible: true,
    order,
  };
}

function reorder(items: MenuItem[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  return copy.map((item, order) => ({ ...item, order }));
}

export const MenuManager = () => {
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_LOCALE);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function loadMenu(targetLocale: AppLocale) {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch(`/api/menu?locale=${targetLocale}`, { cache: "no-store" });
      const payload = (await response.json()) as { items?: MenuItem[]; detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? "Chargement impossible.");
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu(locale);
  }, [locale]);

  async function saveMenu() {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, items }),
      });
      const payload = (await response.json()) as { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? "Enregistrement impossible.");
      setStatus("Menu enregistré.");
      await loadMenu(locale);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function syncFromPages() {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch(`/api/menu/sync-from-pages?locale=${locale}`, { method: "POST" });
      const payload = (await response.json()) as { detail?: string };
      if (!response.ok) throw new Error(payload.detail ?? "Synchronisation impossible.");
      setStatus("Menu synchronisé depuis les pages publiées.");
      await loadMenu(locale);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Synchronisation impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-content" data-testid="admin-menu-page">
      <div className="dashboard-section-header" data-testid="admin-menu-header">
        <div>
          <p className="eyebrow" data-testid="admin-menu-eyebrow">Navigation publique</p>
          <h1 className="admin-title" data-testid="admin-menu-title">Gestionnaire de menu</h1>
          <p className="admin-copy" data-testid="admin-menu-description">Réordonnez, renommez, masquez ou ajoutez des liens externes pour chaque langue.</p>
        </div>
        <div className="dashboard-row-actions" data-testid="admin-menu-header-actions">
          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setItems((current) => [...current, createMenuItem(current.length)])} data-testid="admin-menu-add-item-button">Ajouter un lien</button>
          <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void syncFromPages()} disabled={saving} data-testid="admin-menu-sync-button">Sync pages publiées</button>
          <button type="button" className="primary-button dashboard-inline-button" onClick={() => void saveMenu()} disabled={saving} data-testid="admin-menu-save-button">{saving ? "Enregistrement..." : "Enregistrer"}</button>
        </div>
      </div>

      <div className="dashboard-toolbar" data-testid="admin-menu-toolbar">
        <label className="dashboard-field" data-testid="admin-menu-locale-field">
          <span data-testid="admin-menu-locale-label">Langue</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value as AppLocale)} data-testid="admin-menu-locale-select">
            {SUPPORTED_LOCALES.map((entry) => <option key={entry} value={entry}>{LOCALE_LABELS[entry]}</option>)}
          </select>
        </label>
      </div>

      {error ? <div className="dashboard-alert" data-testid="admin-menu-error-message">{error}</div> : null}
      {status ? <div className="dashboard-empty-state" data-testid="admin-menu-status-message">{status}</div> : null}

      <div className="dashboard-table-card" data-testid="admin-menu-table-card">
        {loading ? <p className="dashboard-empty-state" data-testid="admin-menu-loading-state">Chargement du menu...</p> : null}
        {!loading && items.length === 0 ? <p className="dashboard-empty-state" data-testid="admin-menu-empty-state">Aucun élément de menu pour cette langue.</p> : null}
        <div className="editor-stack" data-testid="admin-menu-items-list">
          {items.map((item, index) => (
            <article className="editor-card" key={item.id} data-testid={`admin-menu-item-${item.id}`}>
              <div className="editor-card-header">
                <div>
                  <p className="status-label" data-testid={`admin-menu-item-order-${item.id}`}>Position {index + 1}</p>
                  <p className="dashboard-row-meta" data-testid={`admin-menu-item-preview-${item.id}`}>{item.label} · {item.href}</p>
                </div>
                <div className="dashboard-row-actions">
                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setItems((current) => reorder(current, index, -1))} data-testid={`admin-menu-item-move-up-${item.id}`}>Monter</button>
                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setItems((current) => reorder(current, index, 1))} data-testid={`admin-menu-item-move-down-${item.id}`}>Descendre</button>
                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id).map((entry, order) => ({ ...entry, order })))} data-testid={`admin-menu-item-delete-${item.id}`}>Supprimer</button>
                </div>
              </div>
              <div className="editor-grid" data-testid={`admin-menu-item-fields-${item.id}`}>
                <label className="dashboard-field"><span data-testid={`admin-menu-item-label-label-${item.id}`}>Libellé</span><input value={item.label} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} data-testid={`admin-menu-item-label-input-${item.id}`} /></label>
                <label className="dashboard-field"><span data-testid={`admin-menu-item-href-label-${item.id}`}>Lien</span><input value={item.href} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, href: event.target.value } : entry))} data-testid={`admin-menu-item-href-input-${item.id}`} /></label>
                <label className="editor-checkbox-row" data-testid={`admin-menu-item-visible-row-${item.id}`}><input type="checkbox" checked={item.isVisible} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isVisible: event.target.checked } : entry))} data-testid={`admin-menu-item-visible-checkbox-${item.id}`} /><span data-testid={`admin-menu-item-visible-label-${item.id}`}>Visible</span></label>
                <label className="editor-checkbox-row" data-testid={`admin-menu-item-external-row-${item.id}`}><input type="checkbox" checked={item.isExternal} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isExternal: event.target.checked } : entry))} data-testid={`admin-menu-item-external-checkbox-${item.id}`} /><span data-testid={`admin-menu-item-external-label-${item.id}`}>Lien externe</span></label>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};