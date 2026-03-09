import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { normalizeLocale } from "@/lib/i18n/config";
import { syncMenuFromPublishedPages } from "@/lib/services/menu";

export async function POST(request: Request) {
  try {
    const user = await requireAdminApiUser();
    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("locale"));
    return NextResponse.json(await syncMenuFromPublishedPages(user.id, locale));
  } catch (error) {
    return toErrorResponse(error, "Impossible de synchroniser le menu.");
  }
}