import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { saveManagedImage } from "@/lib/media/managed-images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminApiUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ detail: "Aucun fichier image fourni." }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ detail: "Le fichier fourni n’est pas une image." }, { status: 400 });
    }

    const saved = await saveManagedImage({
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType,
      kind: "cms",
    });

    return NextResponse.json({ image: saved });
  } catch (error) {
    return toErrorResponse(error, "Impossible d’importer cette image.");
  }
}