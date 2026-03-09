import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { getPendingChanges } from "@/lib/services/pages";

export async function GET() {
  try {
    const user = await requireAdminApiUser();
    return NextResponse.json(await getPendingChanges(user));
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer les validations en attente.");
  }
}