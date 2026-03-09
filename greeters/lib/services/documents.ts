import { listDocuments } from "@/lib/repositories/documents";

export async function getDocuments(category?: string) {
  const documents = await listDocuments({
    where: category ? { category } : undefined,
  });

  return documents.map((document) => ({
    id: document.id,
    filename: document.filename,
    originalFilename: document.originalFilename,
    filePath: document.filePath,
    fileSize: document.fileSize.toString(),
    mimeType: document.mimeType,
    category: document.category,
    description: document.description,
    uploadedBy: document.uploadedBy,
    createdAt: document.createdAt.toISOString(),
  }));
}