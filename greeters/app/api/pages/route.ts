import { NextResponse } from "next/server";

import { requireEditorApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { normalizeLocale } from "@/lib/i18n/config";
import { createPage, getPagesList, parsePageStatusFilter } from "@/lib/services/pages";

export async function GET(request: Request) {
  try {
    await requireEditorApiUser();

    const { searchParams } = new URL(request.url);
    const locale = normalizeLocale(searchParams.get("locale"));
    const status = parsePageStatusFilter(searchParams.get("status"));
    const skip = Number(searchParams.get("skip") ?? "0");
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);
    const pages = await getPagesList({
      locale,
      status,
      skip: Number.isFinite(skip) && skip > 0 ? skip : 0,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    });

    return NextResponse.json(pages);
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer les pages.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireEditorApiUser();
    const page = await createPage(await request.json(), user);
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Impossible de créer la page.");
  }
}