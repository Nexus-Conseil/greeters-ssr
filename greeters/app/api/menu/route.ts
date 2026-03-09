import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { normalizeLocale } from "@/lib/i18n/config";
import { getMenu, updateMenu } from "@/lib/services/menu";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("locale"));
    return NextResponse.json(await getMenu(locale));
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer le menu.");
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdminApiUser();
    const payload = await request.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const locale = normalizeLocale(typeof payload?.locale === "string" ? payload.locale : undefined);
    return NextResponse.json(await updateMenu(items, user.id, locale));
  } catch (error) {
    return toErrorResponse(error, "Impossible de mettre à jour le menu.");
  }
}