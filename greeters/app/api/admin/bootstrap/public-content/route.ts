import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireAdminApiUser } from "@/lib/auth/permissions";
import { bootstrapPublicContent } from "@/lib/services/bootstrap-public-content";

export async function POST() {
  try {
    const user = await requireAdminApiUser();
    const report = await bootstrapPublicContent(user);
    return NextResponse.json({
      message: "Le contenu public par défaut a été prérempli avec succès.",
      report,
    });
  } catch (error) {
    return toErrorResponse(error, "Impossible de préremplir le contenu public par défaut.");
  }
}