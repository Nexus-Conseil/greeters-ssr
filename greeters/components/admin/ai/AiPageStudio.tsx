"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { DEFAULT_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";
import type { EditorPage } from "@/components/admin/pages/editor-types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export const AiPageStudio = () => {
  const router = useRouter();
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_LOCALE);
  const [prompt, setPrompt] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<EditorPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function generateDraft() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/page-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, locale, sessionId }),
      });
      const payload = (await response.json()) as {
        detail?: string;
        sessionId: string;
        generatedPage: EditorPage;
        messages: ChatMessage[];
      };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Génération impossible.");
      }

      setSessionId(payload.sessionId);
      setDraft(payload.generatedPage);
      setMessages(payload.messages);
      setPrompt("");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Génération impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function createDraftPage() {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as { detail?: string; id: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Création impossible.");
      }
      router.push(`/admin/pages/${payload.id}`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-content" data-testid="ai-page-studio-page">
      <div className="dashboard-section-header" data-testid="ai-page-studio-header">
        <div>
          <p className="eyebrow" data-testid="ai-page-studio-eyebrow">Assistant IA</p>
          <h1 className="admin-title" data-testid="ai-page-studio-title">Générer des pages touristiques avec Gemini</h1>
          <p className="admin-copy" data-testid="ai-page-studio-description">Décrivez la page voulue dans le chat : l’IA propose une structure cohérente avec le site, mais varie volontairement les sections et blocs.</p>
        </div>
      </div>

      {error ? <div className="dashboard-alert" data-testid="ai-page-studio-error-message">{error}</div> : null}

      <div className="editor-layout" data-testid="ai-page-studio-layout">
        <div className="editor-main" data-testid="ai-page-studio-main-column">
          <div className="editor-panel" data-testid="ai-page-studio-chat-panel">
            <div className="editor-grid">
              <label className="dashboard-field">
                <span data-testid="ai-page-studio-locale-label">Langue cible</span>
                <select value={locale} onChange={(event) => setLocale(event.target.value as AppLocale)} data-testid="ai-page-studio-locale-select">
                  {SUPPORTED_LOCALES.map((entry) => <option key={entry} value={entry}>{LOCALE_LABELS[entry]}</option>)}
                </select>
              </label>
            </div>
            <label className="dashboard-field" data-testid="ai-page-studio-prompt-field">
              <span data-testid="ai-page-studio-prompt-label">Demande</span>
              <textarea rows={6} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Exemple : crée une page sur les balades gourmandes à Montmartre avec un ton chaleureux, une section pratique, une galerie légère et un CTA de réservation." data-testid="ai-page-studio-prompt-input" />
            </label>
            <div className="dashboard-row-actions" data-testid="ai-page-studio-actions">
              <button type="button" className="primary-button dashboard-inline-button" onClick={() => void generateDraft()} disabled={loading} data-testid="ai-page-studio-generate-button">{loading ? "Génération..." : "Générer une page"}</button>
              {draft ? <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void createDraftPage()} disabled={saving} data-testid="ai-page-studio-create-button">{saving ? "Création..." : "Créer la page dans le CMS"}</button> : null}
            </div>
          </div>

          <div className="editor-panel" data-testid="ai-page-studio-history-panel">
            <p className="status-label" data-testid="ai-page-studio-history-label">Conversation</p>
            <div className="editor-stack" data-testid="ai-page-studio-messages-list">
              {messages.length === 0 ? <p className="dashboard-empty-state" data-testid="ai-page-studio-empty-history">Aucune génération pour le moment.</p> : null}
              {messages.map((message) => (
                <article className={`editor-card ${message.role === "assistant" ? "is-ai-message" : ""}`} key={message.id} data-testid={`ai-page-studio-message-${message.id}`}>
                  <p className="status-label" data-testid={`ai-page-studio-message-role-${message.id}`}>{message.role === "assistant" ? "IA" : "Utilisateur"}</p>
                  <p className="dashboard-row-meta" data-testid={`ai-page-studio-message-content-${message.id}`}>{message.content}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="editor-sidebar" data-testid="ai-page-studio-preview-column">
          <div className="editor-panel" data-testid="ai-page-studio-summary-panel">
            <p className="status-label" data-testid="ai-page-studio-summary-label">Brouillon généré</p>
            {draft ? (
              <>
                <p className="dashboard-row-title" data-testid="ai-page-studio-summary-title">{draft.title}</p>
                <p className="dashboard-row-meta" data-testid="ai-page-studio-summary-slug">/{draft.slug}</p>
                <p className="dashboard-row-meta" data-testid="ai-page-studio-summary-sections">{draft.sections.length} section(s) · {draft.sections.reduce((total, section) => total + section.blocks.length, 0)} bloc(s)</p>
              </>
            ) : (
              <p className="dashboard-empty-state" data-testid="ai-page-studio-summary-empty">Le brouillon IA apparaîtra ici.</p>
            )}
          </div>
        </aside>
      </div>

      {draft ? (
        <div className="dashboard-table-card" data-testid="ai-page-studio-preview-card">
          <DynamicPageRenderer page={draft} />
        </div>
      ) : null}
    </section>
  );
};