import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { removeAdminDocument, updateAdminDocument } from "@/lib/services/admin-documents";

export async function PATCH(request: Request, context: { params: Promise<{ documentId: string }> }) {
  try {
    await requireAdminApiUser();
    const { documentId } = await context.params;
    const payload = (await request.json()) as { category?: string; description?: string };
    const document = await updateAdminDocument(documentId, {
      category: payload.category ?? "general",
      description: payload.description ?? "",
    });
    return NextResponse.json({ document });
  } catch (error) {
    return toErrorResponse(error, "Impossible de mettre à jour ce document.");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  try {
    await requireAdminApiUser();
    const { documentId } = await context.params;
    return NextResponse.json(await removeAdminDocument(documentId));
  } catch (error) {
    return toErrorResponse(error, "Impossible de supprimer ce document.");
  }
}