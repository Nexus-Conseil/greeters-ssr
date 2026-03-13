import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { listAdminDocuments, uploadAdminDocument } from "@/lib/services/admin-documents";

export async function GET() {
  try {
    await requireAdminApiUser();
    return NextResponse.json(await listAdminDocuments());
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer les documents.");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminApiUser();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ detail: "Le fichier est obligatoire." }, { status: 400 });
    }

    const document = await uploadAdminDocument({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      buffer: Buffer.from(await file.arrayBuffer()),
      category: String(formData.get("category") ?? "general"),
      description: String(formData.get("description") ?? ""),
      uploadedBy: actor.email,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Impossible d’ajouter ce document.");
  }
}