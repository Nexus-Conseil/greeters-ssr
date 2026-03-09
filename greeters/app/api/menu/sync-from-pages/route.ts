import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { syncMenuFromPublishedPages } from "@/lib/services/menu";

export async function POST() {
  try {
    const user = await requireAdminApiUser();
    return NextResponse.json(await syncMenuFromPublishedPages(user.id));
  } catch (error) {
    return toErrorResponse(error, "Impossible de synchroniser le menu.");
  }
}