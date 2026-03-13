import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { createDocumentRecord, deleteDocumentRecord, findDocumentById, listDocuments, updateDocumentRecord } from "@/lib/repositories/documents";

export class AdminDocumentsServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminDocumentsServiceError";
  }
}

const DOCUMENTS_DIR = path.join(process.cwd(), "public", "documents");

function sanitizeBaseName(filename: string) {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function toPublicDocument(document: {
  id: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: bigint;
  mimeType: string;
  category: string;
  description: string | null;
  uploadedBy: string;
  createdAt: Date;
}) {
  return {
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
  };
}

export async function listAdminDocuments() {
  const documents = await listDocuments();
  return documents.map(toPublicDocument);
}

export async function uploadAdminDocument(input: {
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  category: string;
  description: string;
  uploadedBy: string;
}) {
  await mkdir(DOCUMENTS_DIR, { recursive: true });

  const originalFilename = input.fileName.trim();
  if (!originalFilename) {
    throw new AdminDocumentsServiceError(400, "Le fichier est obligatoire.");
  }

  const safeName = sanitizeBaseName(originalFilename);
  const uniqueFilename = `${crypto.randomUUID().slice(0, 8)}_${safeName}`;
  const targetPath = path.join(DOCUMENTS_DIR, uniqueFilename);
  await writeFile(targetPath, input.buffer);

  const document = await createDocumentRecord({
    filename: uniqueFilename,
    originalFilename,
    filePath: `/documents/${uniqueFilename}`,
    fileSize: BigInt(input.size),
    mimeType: input.mimeType || "application/octet-stream",
    category: input.category.trim() || "general",
    description: input.description.trim() || null,
    uploadedBy: input.uploadedBy,
  });

  return toPublicDocument(document);
}

export async function updateAdminDocument(documentId: string, input: { category: string; description: string }) {
  const document = await updateDocumentRecord(documentId, {
    category: input.category.trim() || "general",
    description: input.description.trim() || null,
  });
  return toPublicDocument(document);
}

export async function removeAdminDocument(documentId: string) {
  const document = await findDocumentById(documentId);
  if (!document) {
    throw new AdminDocumentsServiceError(404, "Document introuvable.");
  }

  if (document.filePath.startsWith("/documents/")) {
    const absolutePath = path.join(DOCUMENTS_DIR, document.filename);
    await unlink(absolutePath).catch(() => null);
  }

  await deleteDocumentRecord(documentId);
  return { success: true };
}