"use client";

import { useEffect, useMemo, useState } from "react";

type ChatbotUrlEntry = { label: string; url: string };
type ChatbotLanguageRule = { locale: string; guidance: string };
type ChatbotPromptVersion = {
  id: string;
  status: "draft" | "published" | "archived";
  versionNumber: number;
  assistantRole: string;
  systemPrompt: string;
  toneGuidelines: string;
  businessRules: string;
  responseLimits: string;
  importantUrls: ChatbotUrlEntry[];
  bookingRules: string;
  forbiddenRules: string;
  outOfScopeRules: string;
  longResponseRules: string;
  brandVoiceRules: string;
  languageRules: ChatbotLanguageRule[];
  notes: string;
  createdBy: string | null;
  createdAt: string;
  publishedBy: string | null;
  publishedAt: string | null;
};

type ChatbotSettingsBundle = {
  draft: ChatbotPromptVersion;
  published: ChatbotPromptVersion | null;
  history: ChatbotPromptVersion[];
};

type ChatConversationListItem = {
  session_id: string;
  visitor_id: string | null;
  language: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message: string;
  summary?: string | null;
};

type ChatConversationDetail = {
  session_id: string;
  visitor_id: string | null;
  language: string;
  summary?: string | null;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  feedbacks: Record<string, Array<{ id: string; feedback: string; admin_id: string; created_at: string }>>;
};

type ChatFeedback = {
  id: string;
  message_id: string;
  feedback: string;
  admin_id: string;
  created_at: string;
  message_content?: string | null;
};

type ChatImprovement = {
  id: string;
  feedback_summary: string;
  active: boolean;
  created_at: string;
};

const EMPTY_GENERATED = { messageId: "", content: "", mode: "draft" as "draft" | "published" };

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function emptySettings(): ChatbotSettingsBundle {
  const emptyDraft: ChatbotPromptVersion = {
    id: "",
    status: "draft",
    versionNumber: 0,
    assistantRole: "",
    systemPrompt: "",
    toneGuidelines: "",
    businessRules: "",
    responseLimits: "",
    importantUrls: [],
    bookingRules: "",
    forbiddenRules: "",
    outOfScopeRules: "",
    longResponseRules: "",
    brandVoiceRules: "",
    languageRules: [],
    notes: "",
    createdBy: null,
    createdAt: new Date().toISOString(),
    publishedBy: null,
    publishedAt: null,
  };

  return { draft: emptyDraft, published: null, history: [] };
}

export const ChatbotAdminConsole = () => {
  const [activeTab, setActiveTab] = useState<"conversations" | "feedbacks" | "improvements" | "consignes">("conversations");
  const [settings, setSettings] = useState<ChatbotSettingsBundle>(emptySettings());
  const [draft, setDraft] = useState<ChatbotPromptVersion>(emptySettings().draft);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsPublishing, setSettingsPublishing] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [conversations, setConversations] = useState<ChatConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [conversationDetail, setConversationDetail] = useState<ChatConversationDetail | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<ChatFeedback[]>([]);
  const [improvements, setImprovements] = useState<ChatImprovement[]>([]);
  const [generatedReply, setGeneratedReply] = useState(EMPTY_GENERATED);
  const [replyLoadingId, setReplyLoadingId] = useState("");

  async function loadSettings() {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const response = await fetch("/api/admin/chatbot/settings", { cache: "no-store" });
      const payload = (await response.json()) as ChatbotSettingsBundle & { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Impossible de charger les consignes du chatbot.");
      }
      setSettings(payload);
      setDraft(payload.draft);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Impossible de charger les consignes du chatbot.");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadConversations() {
    const response = await fetch("/api/admin/chatbot/conversations", { cache: "no-store" });
    const payload = (await response.json()) as Array<ChatConversationListItem> & { detail?: string };
    if (!response.ok) {
      throw new Error((payload as { detail?: string }).detail ?? "Impossible de charger les conversations.");
    }
    setConversations(Array.isArray(payload) ? payload : []);
  }

  async function loadFeedbacks() {
    const response = await fetch("/api/admin/chatbot/feedbacks", { cache: "no-store" });
    const payload = (await response.json()) as Array<ChatFeedback> & { detail?: string };
    if (!response.ok) {
      throw new Error((payload as { detail?: string }).detail ?? "Impossible de charger les feedbacks.");
    }
    setFeedbacks(Array.isArray(payload) ? payload : []);
  }

  async function loadImprovements() {
    const response = await fetch("/api/admin/chatbot/improvements", { cache: "no-store" });
    const payload = (await response.json()) as Array<ChatImprovement> & { detail?: string };
    if (!response.ok) {
      throw new Error((payload as { detail?: string }).detail ?? "Impossible de charger les améliorations.");
    }
    setImprovements(Array.isArray(payload) ? payload : []);
  }

  async function loadConversationDetail(sessionId: string) {
    setConversationLoading(true);
    try {
      const response = await fetch(`/api/admin/chatbot/conversation/${sessionId}`, { cache: "no-store" });
      const payload = (await response.json()) as ChatConversationDetail & { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Impossible de charger la conversation.");
      }
      setSelectedConversationId(sessionId);
      setConversationDetail(payload);
      setGeneratedReply(EMPTY_GENERATED);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Impossible de charger la conversation.");
    } finally {
      setConversationLoading(false);
    }
  }

  useEffect(() => {
    void Promise.allSettled([loadSettings(), loadConversations(), loadFeedbacks(), loadImprovements()]);
  }, []);

  const activeImprovementCount = useMemo(() => improvements.filter((entry) => entry.active).length, [improvements]);

  async function saveDraft() {
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      const response = await fetch("/api/admin/chatbot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as { draft?: ChatbotPromptVersion; detail?: string };
      if (!response.ok || !payload.draft) {
        throw new Error(payload.detail ?? "Impossible d’enregistrer le brouillon.");
      }
      setDraft(payload.draft);
      setSettings((current) => ({ ...current, draft: payload.draft ?? current.draft }));
      setSettingsSuccess("Brouillon des consignes enregistré.");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Impossible d’enregistrer le brouillon.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function publishDraft() {
    setSettingsPublishing(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      const response = await fetch("/api/admin/chatbot/settings/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draft.notes }),
      });
      const payload = (await response.json()) as { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Impossible de publier les consignes.");
      }
      await loadSettings();
      setSettingsSuccess("Consignes publiées avec succès.");
      setActiveTab("consignes");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Impossible de publier les consignes.");
    } finally {
      setSettingsPublishing(false);
    }
  }

  async function rollbackVersion(versionId: string) {
    setSettingsPublishing(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      const response = await fetch(`/api/admin/chatbot/settings/rollback/${versionId}`, { method: "POST" });
      const payload = (await response.json()) as { detail?: string };
      if (!response.ok) {
        throw new Error(payload.detail ?? "Impossible de restaurer cette version.");
      }
      await loadSettings();
      setSettingsSuccess("Version restaurée et publiée.");
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Impossible de restaurer cette version.");
    } finally {
      setSettingsPublishing(false);
    }
  }

  async function generateReply(messageId: string, mode: "draft" | "published") {
    if (!selectedConversationId) {
      return;
    }

    setReplyLoadingId(`${messageId}-${mode}`);
    setSettingsError("");
    try {
      const response = await fetch(`/api/admin/chatbot/conversation/${selectedConversationId}/generate-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, mode }),
      });
      const payload = (await response.json()) as { content?: string; detail?: string };
      if (!response.ok || !payload.content) {
        throw new Error(payload.detail ?? "Impossible de générer la réponse de test.");
      }
      setGeneratedReply({ messageId, content: payload.content, mode });
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : "Impossible de générer la réponse de test.");
    } finally {
      setReplyLoadingId("");
    }
  }

  async function submitFeedback(messageId: string) {
    const feedback = feedbackByMessage[messageId]?.trim();
    if (!feedback || !selectedConversationId) {
      return;
    }

    const response = await fetch("/api/admin/chatbot/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: selectedConversationId, messageId, feedback }),
    });
    const payload = (await response.json()) as { detail?: string };
    if (!response.ok) {
      throw new Error(payload.detail ?? "Impossible d’ajouter le feedback.");
    }

    setFeedbackByMessage((current) => ({ ...current, [messageId]: "" }));
    await Promise.all([loadFeedbacks(), loadConversationDetail(selectedConversationId)]);
  }

  async function deleteFeedback(feedbackId: string) {
    const response = await fetch(`/api/admin/chatbot/feedback/${feedbackId}`, { method: "DELETE" });
    const payload = (await response.json()) as { detail?: string };
    if (!response.ok) {
      throw new Error(payload.detail ?? "Impossible de supprimer le feedback.");
    }
    await Promise.all([loadFeedbacks(), selectedConversationId ? loadConversationDetail(selectedConversationId) : Promise.resolve()]);
  }

  async function synthesizeImprovements() {
    setSettingsError("");
    const response = await fetch("/api/admin/chatbot/synthesize-improvements", { method: "POST" });
    const payload = (await response.json()) as { detail?: string };
    if (!response.ok) {
      throw new Error(payload.detail ?? "Impossible de synthétiser les améliorations.");
    }
    await loadImprovements();
  }

  async function deactivateImprovement(improvementId: string) {
    const response = await fetch(`/api/admin/chatbot/improvement/${improvementId}`, { method: "DELETE" });
    const payload = (await response.json()) as { detail?: string };
    if (!response.ok) {
      throw new Error(payload.detail ?? "Impossible de désactiver cette amélioration.");
    }
    await loadImprovements();
  }

  return (
    <section className="dashboard-content" data-testid="admin-chatbot-page">
      <div className="dashboard-hero" data-testid="admin-chatbot-hero">
        <p className="eyebrow" data-testid="admin-chatbot-eyebrow">Chatbot & mémoire visiteur</p>
        <h1 className="text-3xl font-semibold" data-testid="admin-chatbot-title">Pilotage conversationnel de l’assistant Paris Greeters</h1>
        <p className="dashboard-card-copy" data-testid="admin-chatbot-description">Conversations, feedbacks, améliorations IA et consignes éditables dans une seule interface admin.</p>
      </div>

      {settingsError ? <div className="dashboard-alert" data-testid="admin-chatbot-error-message">{settingsError}</div> : null}
      {settingsSuccess ? <div className="dashboard-success" data-testid="admin-chatbot-success-message">{settingsSuccess}</div> : null}

      <div className="dashboard-table-card p-2" data-testid="admin-chatbot-tab-bar">
        <div className="grid gap-2 md:grid-cols-4">
          {[
            ["conversations", `Conversations (${conversations.length})`],
            ["feedbacks", `Feedbacks (${feedbacks.length})`],
            ["improvements", `Améliorations (${activeImprovementCount})`],
            ["consignes", "Consignes IA"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === key ? "bg-[#7daa2f] text-white" : "bg-white text-slate-700"}`}
              data-testid={`admin-chatbot-tab-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "conversations" ? (
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]" data-testid="admin-chatbot-conversations-tab">
          <div className="dashboard-table-card overflow-hidden" data-testid="admin-chatbot-conversations-card">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <h2 className="text-lg font-semibold" data-testid="admin-chatbot-conversations-title">Conversations</h2>
            </div>
            <div className="max-h-[720px] overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation.session_id}
                  type="button"
                  onClick={() => void loadConversationDetail(conversation.session_id)}
                  className={`w-full border-b border-[var(--line)] px-5 py-4 text-left ${selectedConversationId === conversation.session_id ? "bg-[#f3f8e8]" : "bg-white hover:bg-[#fafaf5]"}`}
                  data-testid={`admin-chatbot-conversation-button-${conversation.session_id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#eef4df] px-2 py-1 text-xs font-semibold uppercase text-[#5d8120]" data-testid={`admin-chatbot-conversation-language-${conversation.session_id}`}>{conversation.language || "fr"}</span>
                    <span className="text-xs text-slate-500" data-testid={`admin-chatbot-conversation-message-count-${conversation.session_id}`}>{conversation.message_count} messages</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900" data-testid={`admin-chatbot-conversation-last-message-${conversation.session_id}`}>{conversation.last_message || "Conversation en cours"}</p>
                  <p className="mt-1 text-xs text-slate-500" data-testid={`admin-chatbot-conversation-meta-${conversation.session_id}`}>{formatDate(conversation.updated_at)}</p>
                </button>
              ))}
              {!conversations.length ? <div className="p-6 text-sm text-slate-500" data-testid="admin-chatbot-conversations-empty">Aucune conversation enregistrée pour le moment.</div> : null}
            </div>
          </div>

          <div className="space-y-4" data-testid="admin-chatbot-conversation-detail-area">
            {conversationDetail ? (
              <>
                <div className="dashboard-table-card p-5" data-testid="admin-chatbot-conversation-summary-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold" data-testid="admin-chatbot-conversation-summary-title">Conversation sélectionnée</h2>
                      <p className="text-sm text-slate-500" data-testid="admin-chatbot-conversation-summary-meta">Visiteur {conversationDetail.visitor_id ?? "anonyme"} • {formatDate(conversationDetail.updated_at)}</p>
                    </div>
                  </div>
                  {conversationDetail.summary ? <p className="mt-3 text-sm leading-7 text-slate-700" data-testid="admin-chatbot-conversation-summary-text">{conversationDetail.summary}</p> : null}
                </div>

                <div className="dashboard-table-card p-5" data-testid="admin-chatbot-thread-card">
                  <div className="max-h-[680px] space-y-4 overflow-y-auto">
                    {conversationLoading ? <div className="dashboard-empty-state" data-testid="admin-chatbot-thread-loading">Chargement de la conversation…</div> : null}
                    {conversationDetail.messages.map((message, messageIndex) => {
                      const historicalAssistantReply = message.role === "user"
                        ? conversationDetail.messages.slice(messageIndex + 1).find((entry) => entry.role === "assistant")
                        : null;

                      return (
                      <div key={message.id} className="space-y-3" data-testid={`admin-chatbot-thread-message-${message.id}`}>
                        <div className={`rounded-2xl border px-4 py-4 text-sm leading-7 ${message.role === "user" ? "border-[#d9e7bc] bg-[#f5faeb]" : "border-slate-200 bg-slate-50"}`}>
                          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                            <span data-testid={`admin-chatbot-thread-message-role-${message.id}`}>{message.role === "user" ? "Visiteur" : "Assistant"}</span>
                            <span data-testid={`admin-chatbot-thread-message-date-${message.id}`}>{formatDate(message.timestamp)}</span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-slate-900" data-testid={`admin-chatbot-thread-message-content-${message.id}`}>{message.content}</p>
                        </div>

                        {message.role === "user" ? (
                          <div className="flex flex-wrap gap-2" data-testid={`admin-chatbot-generate-actions-${message.id}`}>
                            <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void generateReply(message.id, "draft")} disabled={replyLoadingId === `${message.id}-draft`} data-testid={`admin-chatbot-generate-draft-button-${message.id}`}>{replyLoadingId === `${message.id}-draft` ? "Génération…" : "Générer une réponse (brouillon)"}</button>
                            <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void generateReply(message.id, "published")} disabled={replyLoadingId === `${message.id}-published`} data-testid={`admin-chatbot-generate-published-button-${message.id}`}>{replyLoadingId === `${message.id}-published` ? "Génération…" : "Générer une réponse (publiée)"}</button>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-[#efe4b2] bg-[#fff7da] p-4" data-testid={`admin-chatbot-feedback-box-${message.id}`}>
                            <label className="dashboard-field">
                              <span data-testid={`admin-chatbot-feedback-label-${message.id}`}>Commentaire métier sur cette réponse</span>
                              <textarea rows={3} value={feedbackByMessage[message.id] ?? ""} onChange={(event) => setFeedbackByMessage((current) => ({ ...current, [message.id]: event.target.value }))} data-testid={`admin-chatbot-feedback-input-${message.id}`} />
                            </label>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button type="button" className="primary-button dashboard-inline-button" onClick={() => void submitFeedback(message.id)} data-testid={`admin-chatbot-feedback-submit-button-${message.id}`}>Ajouter le feedback</button>
                            </div>
                            {(conversationDetail.feedbacks[message.id] ?? []).map((entry) => (
                              <div key={entry.id} className="mt-3 rounded-xl border border-[#d9e7bc] bg-white px-4 py-3 text-sm text-slate-700" data-testid={`admin-chatbot-feedback-item-${entry.id}`}>
                                <div className="flex items-center justify-between gap-3">
                                  <p data-testid={`admin-chatbot-feedback-content-${entry.id}`}>{entry.feedback}</p>
                                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void deleteFeedback(entry.id)} data-testid={`admin-chatbot-feedback-delete-button-${entry.id}`}>Supprimer</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {generatedReply.messageId === message.id ? (
                          <div className="grid gap-4 xl:grid-cols-2" data-testid={`admin-chatbot-response-comparator-${message.id}`}>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4" data-testid={`admin-chatbot-response-comparator-historical-${message.id}`}>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500" data-testid={`admin-chatbot-response-comparator-historical-label-${message.id}`}>Réponse historique</p>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-900" data-testid={`admin-chatbot-response-comparator-historical-content-${message.id}`}>{historicalAssistantReply?.content ?? "Aucune réponse historique disponible après ce message."}</p>
                            </div>
                            <div className="rounded-2xl border border-[#cdddf4] bg-[#f2f7ff] p-4" data-testid={`admin-chatbot-response-comparator-generated-${message.id}`}>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500" data-testid={`admin-chatbot-response-comparator-generated-label-${message.id}`}>Nouvelle réponse {generatedReply.mode === "draft" ? "(brouillon)" : "(publiée)"}</p>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-900" data-testid={`admin-chatbot-response-comparator-generated-content-${message.id}`}>{generatedReply.content}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )})}
                  </div>
                </div>
              </>
            ) : <div className="dashboard-empty-state" data-testid="admin-chatbot-conversation-placeholder">Sélectionnez une conversation pour analyser l’historique et tester une nouvelle réponse.</div>}
          </div>
        </div>
      ) : null}

      {activeTab === "feedbacks" ? (
        <div className="dashboard-table-card p-5" data-testid="admin-chatbot-feedbacks-tab">
          <h2 className="text-lg font-semibold" data-testid="admin-chatbot-feedbacks-title">Tous les feedbacks collectés</h2>
          <div className="mt-4 space-y-3">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="rounded-xl border border-[var(--line)] bg-white px-4 py-4" data-testid={`admin-chatbot-feedback-row-${feedback.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-900" data-testid={`admin-chatbot-feedback-row-content-${feedback.id}`}>{feedback.feedback}</p>
                    <p className="mt-1 text-xs text-slate-500" data-testid={`admin-chatbot-feedback-row-meta-${feedback.id}`}>{formatDate(feedback.created_at)}</p>
                  </div>
                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void deleteFeedback(feedback.id)} data-testid={`admin-chatbot-feedback-row-delete-${feedback.id}`}>Supprimer</button>
                </div>
              </div>
            ))}
            {!feedbacks.length ? <div className="dashboard-empty-state" data-testid="admin-chatbot-feedbacks-empty">Aucun feedback enregistré pour l’instant.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "improvements" ? (
        <div className="dashboard-table-card p-5" data-testid="admin-chatbot-improvements-tab">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" data-testid="admin-chatbot-improvements-title">Améliorations synthétisées</h2>
              <p className="mt-1 text-sm text-slate-500" data-testid="admin-chatbot-improvements-description">Synthèse des feedbacks métier pour enrichir les consignes IA.</p>
            </div>
            <button type="button" className="primary-button dashboard-inline-button" onClick={() => void synthesizeImprovements()} data-testid="admin-chatbot-improvements-synthesize-button">Synthétiser les feedbacks</button>
          </div>
          <div className="mt-4 space-y-3">
            {improvements.map((improvement) => (
              <div key={improvement.id} className={`rounded-xl border px-4 py-4 ${improvement.active ? "border-[#d9e7bc] bg-[#f5faeb]" : "border-[var(--line)] bg-white opacity-70"}`} data-testid={`admin-chatbot-improvement-row-${improvement.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm leading-7 text-slate-900" data-testid={`admin-chatbot-improvement-content-${improvement.id}`}>{improvement.feedback_summary}</p>
                    <p className="mt-2 text-xs text-slate-500" data-testid={`admin-chatbot-improvement-date-${improvement.id}`}>{formatDate(improvement.created_at)}</p>
                  </div>
                  {improvement.active ? <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void deactivateImprovement(improvement.id)} data-testid={`admin-chatbot-improvement-deactivate-${improvement.id}`}>Désactiver</button> : null}
                </div>
              </div>
            ))}
            {!improvements.length ? <div className="dashboard-empty-state" data-testid="admin-chatbot-improvements-empty">Aucune amélioration disponible pour le moment.</div> : null}
          </div>
        </div>
      ) : null}

      {activeTab === "consignes" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]" data-testid="admin-chatbot-settings-tab">
          <div className="space-y-4">
            <div className="dashboard-table-card p-5" data-testid="admin-chatbot-settings-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold" data-testid="admin-chatbot-settings-title">Consignes éditables du chatbot</h2>
                  <p className="mt-1 text-sm text-slate-500" data-testid="admin-chatbot-settings-meta">Version publiée actuelle : {settings.published ? `v${settings.published.versionNumber}` : "aucune"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void loadSettings()} data-testid="admin-chatbot-settings-refresh-button">Recharger</button>
                  <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void saveDraft()} disabled={settingsSaving || settingsLoading} data-testid="admin-chatbot-settings-save-button">{settingsSaving ? "Enregistrement…" : "Enregistrer le brouillon"}</button>
                  <button type="button" className="primary-button dashboard-inline-button" onClick={() => void publishDraft()} disabled={settingsPublishing || settingsLoading} data-testid="admin-chatbot-settings-publish-button">{settingsPublishing ? "Publication…" : "Publier"}</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ["Rôle de l’assistant", "assistantRole"],
                  ["Prompt système principal", "systemPrompt"],
                  ["Consignes de ton", "toneGuidelines"],
                  ["Comment parler de Paris Greeters", "brandVoiceRules"],
                  ["Règles métier", "businessRules"],
                  ["Règles de réservation", "bookingRules"],
                  ["Limites de réponse", "responseLimits"],
                  ["Réponses hors périmètre", "outOfScopeRules"],
                  ["Gestion des réponses trop longues", "longResponseRules"],
                  ["Interdits", "forbiddenRules"],
                ].map(([label, key]) => (
                  <label key={key} className={`dashboard-field ${key === "systemPrompt" || key === "businessRules" ? "md:col-span-2" : ""}`} data-testid={`admin-chatbot-settings-field-${key}`}>
                    <span data-testid={`admin-chatbot-settings-label-${key}`}>{label}</span>
                    <textarea rows={key === "systemPrompt" ? 6 : 4} value={(draft as unknown as Record<string, string>)[key] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} data-testid={`admin-chatbot-settings-input-${key}`} />
                  </label>
                ))}

                <div className="editor-panel md:col-span-2 p-4" data-testid="admin-chatbot-settings-urls-panel">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold" data-testid="admin-chatbot-settings-urls-title">URLs importantes à citer</h3>
                    </div>
                    <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setDraft((current) => ({ ...current, importantUrls: [...current.importantUrls, { label: "", url: "" }] }))} data-testid="admin-chatbot-settings-add-url-button">Ajouter une URL</button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {draft.importantUrls.map((entry, index) => (
                      <div key={`${entry.label}-${index}`} className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]" data-testid={`admin-chatbot-settings-url-row-${index}`}>
                        <input value={entry.label} onChange={(event) => setDraft((current) => ({ ...current, importantUrls: current.importantUrls.map((urlEntry, urlIndex) => urlIndex === index ? { ...urlEntry, label: event.target.value } : urlEntry) }))} placeholder="Libellé" data-testid={`admin-chatbot-settings-url-label-${index}`} />
                        <input value={entry.url} onChange={(event) => setDraft((current) => ({ ...current, importantUrls: current.importantUrls.map((urlEntry, urlIndex) => urlIndex === index ? { ...urlEntry, url: event.target.value } : urlEntry) }))} placeholder="https://..." data-testid={`admin-chatbot-settings-url-value-${index}`} />
                        <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setDraft((current) => ({ ...current, importantUrls: current.importantUrls.filter((_, urlIndex) => urlIndex !== index) }))} data-testid={`admin-chatbot-settings-url-delete-${index}`}>Retirer</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="editor-panel md:col-span-2 p-4" data-testid="admin-chatbot-settings-language-panel">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold" data-testid="admin-chatbot-settings-language-title">Variantes par langue</h3>
                    </div>
                    <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setDraft((current) => ({ ...current, languageRules: [...current.languageRules, { locale: "fr", guidance: "" }] }))} data-testid="admin-chatbot-settings-add-language-button">Ajouter une langue</button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {draft.languageRules.map((entry, index) => (
                      <div key={`${entry.locale}-${index}`} className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)_auto]" data-testid={`admin-chatbot-settings-language-row-${index}`}>
                        <input value={entry.locale} onChange={(event) => setDraft((current) => ({ ...current, languageRules: current.languageRules.map((languageEntry, languageIndex) => languageIndex === index ? { ...languageEntry, locale: event.target.value } : languageEntry) }))} placeholder="fr" data-testid={`admin-chatbot-settings-language-locale-${index}`} />
                        <textarea rows={3} value={entry.guidance} onChange={(event) => setDraft((current) => ({ ...current, languageRules: current.languageRules.map((languageEntry, languageIndex) => languageIndex === index ? { ...languageEntry, guidance: event.target.value } : languageEntry) }))} placeholder="Consigne spécifique à cette langue" data-testid={`admin-chatbot-settings-language-guidance-${index}`} />
                        <button type="button" className="secondary-button dashboard-inline-button" onClick={() => setDraft((current) => ({ ...current, languageRules: current.languageRules.filter((_, languageIndex) => languageIndex !== index) }))} data-testid={`admin-chatbot-settings-language-delete-${index}`}>Retirer</button>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="dashboard-field md:col-span-2" data-testid="admin-chatbot-settings-field-notes">
                  <span data-testid="admin-chatbot-settings-label-notes">Note de publication</span>
                  <textarea rows={3} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} data-testid="admin-chatbot-settings-input-notes" />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4" data-testid="admin-chatbot-settings-sidebar">
            <div className="dashboard-table-card p-5" data-testid="admin-chatbot-published-card">
              <h3 className="text-base font-semibold" data-testid="admin-chatbot-published-title">Version publiée</h3>
              {settings.published ? (
                <>
                  <p className="mt-3 text-sm text-slate-900" data-testid="admin-chatbot-published-version">Version {settings.published.versionNumber}</p>
                  <p className="mt-1 text-sm text-slate-500" data-testid="admin-chatbot-published-date">Publiée le {formatDate(settings.published.publishedAt)}</p>
                </>
              ) : <p className="mt-3 text-sm text-slate-500" data-testid="admin-chatbot-published-empty">Aucune version publiée pour le moment.</p>}
            </div>

            <div className="dashboard-table-card p-5" data-testid="admin-chatbot-history-card">
              <h3 className="text-base font-semibold" data-testid="admin-chatbot-history-title">Historique des versions</h3>
              <div className="mt-4 space-y-3">
                {settings.history.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-[var(--line)] bg-white px-4 py-4" data-testid={`admin-chatbot-history-row-${entry.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900" data-testid={`admin-chatbot-history-version-${entry.id}`}>Version {entry.versionNumber} • {entry.status}</p>
                        <p className="mt-1 text-xs text-slate-500" data-testid={`admin-chatbot-history-date-${entry.id}`}>{formatDate(entry.publishedAt ?? entry.createdAt)}</p>
                        {entry.notes ? <p className="mt-2 text-sm text-slate-700" data-testid={`admin-chatbot-history-notes-${entry.id}`}>{entry.notes}</p> : null}
                      </div>
                      <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void rollbackVersion(entry.id)} data-testid={`admin-chatbot-history-rollback-button-${entry.id}`}>Restaurer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};