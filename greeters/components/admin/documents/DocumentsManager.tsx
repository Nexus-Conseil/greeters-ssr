"use client";

import { useMemo, useState } from "react";

type AdminDocument = {
  id: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: string;
  mimeType: string;
  category: string;
  description: string | null;
  uploadedBy: string;
  createdAt: string;
};

type DocumentsManagerProps = {
  initialDocuments: AdminDocument[];
};

export const DocumentsManager = ({ initialDocuments }: DocumentsManagerProps) => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = useMemo(() => Array.from(new Set(documents.map((document) => document.category))), [documents]);

  async function uploadDocument() {
    if (!selectedFile) {
      setError("Sélectionnez un fichier avant l’envoi.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", category);
      formData.append("description", description);
      const response = await fetch("/api/admin/documents", { method: "POST", body: formData });
      const payload = (await response.json()) as { document?: AdminDocument; detail?: string };
      if (!response.ok || !payload.document) {
        throw new Error(payload.detail ?? "Impossible d’ajouter ce document.");
      }
      setDocuments((current) => [payload.document!, ...current]);
      setSelectedFile(null);
      setCategory("general");
      setDescription("");
      setSuccess("Document ajouté avec succès.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Impossible d’ajouter ce document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateDocument(documentId: string, updates: { category: string; description: string }) {
    setError("");
    const response = await fetch(`/api/admin/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const payload = (await response.json()) as { document?: AdminDocument; detail?: string };
    if (!response.ok || !payload.document) {
      setError(payload.detail ?? "Impossible de mettre à jour ce document.");
      return;
    }
    setDocuments((current) => current.map((document) => (document.id === documentId ? payload.document! : document)));
    setSuccess("Document mis à jour.");
  }

  async function deleteDocument(documentId: string) {
    setError("");
    const response = await fetch(`/api/admin/documents/${documentId}`, { method: "DELETE" });
    const payload = (await response.json()) as { detail?: string };
    if (!response.ok) {
      setError(payload.detail ?? "Impossible de supprimer ce document.");
      return;
    }
    setDocuments((current) => current.filter((document) => document.id !== documentId));
    setSuccess("Document supprimé.");
  }

  return (
    <main className="p-6 lg:p-8" data-testid="admin-documents-page">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8bc34a]" data-testid="admin-documents-eyebrow">Documents</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900" data-testid="admin-documents-title">Gestion documentaire SSR</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600" data-testid="admin-documents-description">Ajoutez, ajustez et supprimez les documents téléchargeables directement depuis le back-office SSR.</p>
      </section>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" data-testid="admin-documents-error-message">{error}</div> : null}
      {success ? <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" data-testid="admin-documents-success-message">{success}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]" data-testid="admin-documents-layout">
        <div className="rounded-2xl bg-white p-6 shadow-sm" data-testid="admin-documents-upload-card">
          <h2 className="text-lg font-semibold text-slate-900" data-testid="admin-documents-upload-title">Ajouter un document</h2>
          <div className="mt-5 space-y-4">
            <label className="block" data-testid="admin-documents-file-field">
              <span className="text-sm font-medium text-slate-700">Fichier</span>
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} data-testid="admin-documents-file-input" />
            </label>
            <label className="block" data-testid="admin-documents-category-field">
              <span className="text-sm font-medium text-slate-700">Catégorie</span>
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="admin-documents-category-input" />
            </label>
            <label className="block" data-testid="admin-documents-description-field">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} data-testid="admin-documents-description-input" />
            </label>
            <button type="button" className="inline-flex w-full items-center justify-center rounded-lg bg-[#8bc34a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7daa2f]" onClick={() => void uploadDocument()} disabled={submitting} data-testid="admin-documents-upload-button">{submitting ? "Envoi..." : "Ajouter le document"}</button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm" data-testid="admin-documents-table-card">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900" data-testid="admin-documents-table-title">Documents enregistrés</h2>
              <p className="mt-1 text-sm text-slate-500" data-testid="admin-documents-table-count">{documents.length} document(s) • {categories.length} catégorie(s)</p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="rounded-xl border border-slate-200 p-4" data-testid={`admin-documents-row-${document.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <a href={document.filePath} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4" data-testid={`admin-documents-name-${document.id}`}>{document.originalFilename}</a>
                    <p className="mt-1 text-sm text-slate-500" data-testid={`admin-documents-meta-${document.id}`}>{Math.round(Number(document.fileSize) / 1024)} Ko • {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(document.createdAt))}</p>
                  </div>
                  <button type="button" className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50" onClick={() => void deleteDocument(document.id)} data-testid={`admin-documents-delete-button-${document.id}`}>Supprimer</button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                  <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" defaultValue={document.category} onBlur={(event) => void updateDocument(document.id, { category: event.target.value, description: document.description ?? "" })} data-testid={`admin-documents-category-edit-${document.id}`} />
                  <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" defaultValue={document.description ?? ""} onBlur={(event) => void updateDocument(document.id, { category: document.category, description: event.target.value })} data-testid={`admin-documents-description-edit-${document.id}`} />
                  <a href={document.filePath} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200" data-testid={`admin-documents-download-button-${document.id}`}>Télécharger</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};