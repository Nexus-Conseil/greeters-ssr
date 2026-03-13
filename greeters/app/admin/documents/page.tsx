import { getDocuments } from "@/lib/services/documents";

export default async function AdminDocumentsPage() {
  const documents = await getDocuments();

  return (
    <main className="p-6 lg:p-8" data-testid="admin-documents-page">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8bc34a]" data-testid="admin-documents-eyebrow">Documents</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900" data-testid="admin-documents-title">Bibliothèque documentaire actuelle</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600" data-testid="admin-documents-description">Cette page pose la base SSR du futur module documentaire complet repris de la CSR.</p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm" data-testid="admin-documents-table-card">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900" data-testid="admin-documents-table-title">Documents enregistrés</h2>
            <p className="mt-1 text-sm text-slate-500" data-testid="admin-documents-table-count">{documents.length} document(s)</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200" data-testid="admin-documents-table">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="py-3 pr-4">Nom</th>
                <th className="py-3 pr-4">Catégorie</th>
                <th className="py-3 pr-4">Taille</th>
                <th className="py-3">Ajouté le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {documents.map((document) => (
                <tr key={document.id} data-testid={`admin-documents-row-${document.id}`}>
                  <td className="py-4 pr-4 font-medium text-slate-900" data-testid={`admin-documents-name-${document.id}`}>{document.originalFilename}</td>
                  <td className="py-4 pr-4" data-testid={`admin-documents-category-${document.id}`}>{document.category}</td>
                  <td className="py-4 pr-4" data-testid={`admin-documents-size-${document.id}`}>{Math.round(Number(document.fileSize) / 1024)} Ko</td>
                  <td className="py-4" data-testid={`admin-documents-created-at-${document.id}`}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(document.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}