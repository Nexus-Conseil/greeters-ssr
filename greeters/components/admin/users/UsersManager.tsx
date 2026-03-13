"use client";

import { useMemo, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
  createdAt: string;
};

type UsersManagerProps = {
  initialUsers: AdminUser[];
};

export const UsersManager = ({ initialUsers }: UsersManagerProps) => {
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EDITOR" as AdminUser["role"] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => user.role !== "EDITOR").length,
  }), [users]);

  async function createUser() {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { user?: AdminUser; detail?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.detail ?? "Impossible de créer cet utilisateur.");
      }
      setUsers((current) => [payload.user!, ...current]);
      setForm({ name: "", email: "", password: "", role: "EDITOR" });
      setSuccess("Utilisateur créé avec succès.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Impossible de créer cet utilisateur.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(userId: string, role: AdminUser["role"]) {
    setError("");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const payload = (await response.json()) as { user?: AdminUser; detail?: string };
    if (!response.ok || !payload.user) {
      setError(payload.detail ?? "Impossible de modifier le rôle.");
      return;
    }
    setUsers((current) => current.map((user) => (user.id === userId ? payload.user! : user)));
    setSuccess("Rôle mis à jour.");
  }

  async function deleteUser(userId: string) {
    setError("");
    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const payload = (await response.json()) as { detail?: string };
    if (!response.ok) {
      setError(payload.detail ?? "Impossible de supprimer cet utilisateur.");
      return;
    }
    setUsers((current) => current.filter((user) => user.id !== userId));
    setSuccess("Utilisateur supprimé.");
  }

  return (
    <main className="p-6 lg:p-8" data-testid="admin-users-page">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8bc34a]" data-testid="admin-users-eyebrow">Utilisateurs</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900" data-testid="admin-users-title">Gestion des comptes admin</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600" data-testid="admin-users-description">Créez des comptes, ajustez les rôles et maintenez la base utilisateurs du back-office SSR.</p>
      </section>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" data-testid="admin-users-error-message">{error}</div> : null}
      {success ? <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" data-testid="admin-users-success-message">{success}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]" data-testid="admin-users-layout">
        <div className="rounded-2xl bg-white p-6 shadow-sm" data-testid="admin-users-create-card">
          <h2 className="text-lg font-semibold text-slate-900" data-testid="admin-users-create-title">Créer un utilisateur</h2>
          <div className="mt-5 space-y-4">
            <label className="block" data-testid="admin-users-name-field">
              <span className="text-sm font-medium text-slate-700">Nom</span>
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} data-testid="admin-users-name-input" />
            </label>
            <label className="block" data-testid="admin-users-email-field">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} data-testid="admin-users-email-input" />
            </label>
            <label className="block" data-testid="admin-users-password-field">
              <span className="text-sm font-medium text-slate-700">Mot de passe</span>
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} data-testid="admin-users-password-input" />
            </label>
            <label className="block" data-testid="admin-users-role-field">
              <span className="text-sm font-medium text-slate-700">Rôle</span>
              <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AdminUser["role"] }))} data-testid="admin-users-role-input">
                <option value="EDITOR">Éditeur</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </select>
            </label>
            <button type="button" className="inline-flex w-full items-center justify-center rounded-lg bg-[#8bc34a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7daa2f]" onClick={() => void createUser()} disabled={submitting} data-testid="admin-users-create-button">{submitting ? "Création..." : "Créer l’utilisateur"}</button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm" data-testid="admin-users-table-card">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900" data-testid="admin-users-table-title">Comptes existants</h2>
              <p className="mt-1 text-sm text-slate-500" data-testid="admin-users-table-count">{counts.total} compte(s), dont {counts.admins} avec rôle admin</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200" data-testid="admin-users-table">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="py-3 pr-4">Nom</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Rôle</th>
                  <th className="py-3 pr-4">Créé le</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} data-testid={`admin-users-row-${user.id}`}>
                    <td className="py-4 pr-4 font-medium text-slate-900" data-testid={`admin-users-name-${user.id}`}>{user.name}</td>
                    <td className="py-4 pr-4" data-testid={`admin-users-email-${user.id}`}>{user.email}</td>
                    <td className="py-4 pr-4">
                      <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={user.role} onChange={(event) => void updateRole(user.id, event.target.value as AdminUser["role"])} data-testid={`admin-users-role-select-${user.id}`}>
                        <option value="EDITOR">Éditeur</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super admin</option>
                      </select>
                    </td>
                    <td className="py-4 pr-4" data-testid={`admin-users-created-at-${user.id}`}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td>
                    <td className="py-4">
                      <button type="button" className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50" onClick={() => void deleteUser(user.id)} data-testid={`admin-users-delete-button-${user.id}`}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};