import { DocumentsManager } from "@/components/admin/documents/DocumentsManager";
import { listAdminDocuments } from "@/lib/services/admin-documents";

export default async function AdminDocumentsPage() {
  const documents = await listAdminDocuments();
  return <DocumentsManager initialDocuments={documents} />;
}