import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { getMenu, updateMenu } from "@/lib/services/menu";

export async function GET() {
  try {
    return NextResponse.json(await getMenu());
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer le menu.");
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdminApiUser();
    const payload = await request.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return NextResponse.json(await updateMenu(items, user.id));
  } catch (error) {
    return toErrorResponse(error, "Impossible de mettre à jour le menu.");
  }
}