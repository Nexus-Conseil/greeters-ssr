import { listAdminUsers } from "@/lib/services/admin-users";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return (
    <main className="p-6 lg:p-8" data-testid="admin-users-page">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8bc34a]" data-testid="admin-users-eyebrow">Utilisateurs</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900" data-testid="admin-users-title">Base utilisateurs actuelle</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600" data-testid="admin-users-description">Ce module matérialise l’étape suivante de parité SSR. La gestion complète (création, suppression, reset password) sera branchée sur cette base.</p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm" data-testid="admin-users-table-card">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900" data-testid="admin-users-table-title">Comptes existants</h2>
            <p className="mt-1 text-sm text-slate-500" data-testid="admin-users-table-count">{users.length} compte(s)</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200" data-testid="admin-users-table">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="py-3 pr-4">Nom</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Rôle</th>
                <th className="py-3">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {users.map((user) => (
                <tr key={user.id} data-testid={`admin-users-row-${user.id}`}>
                  <td className="py-4 pr-4 font-medium text-slate-900" data-testid={`admin-users-name-${user.id}`}>{user.name}</td>
                  <td className="py-4 pr-4" data-testid={`admin-users-email-${user.id}`}>{user.email}</td>
                  <td className="py-4 pr-4" data-testid={`admin-users-role-${user.id}`}>{user.role}</td>
                  <td className="py-4" data-testid={`admin-users-created-at-${user.id}`}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}