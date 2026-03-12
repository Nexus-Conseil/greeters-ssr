import { NextResponse } from "next/server";

import { requireAdminApiUser, requireEditorApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { getPageByIdOrThrow, removePage, updatePage } from "@/lib/services/pages";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    await requireEditorApiUser();
    const { id } = await params;
    return NextResponse.json(await getPageByIdOrThrow(id));
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer la page.");
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const user = await requireEditorApiUser();
    const { id } = await params;
    return NextResponse.json(await updatePage(id, await request.json(), user));
  } catch (error) {
    return toErrorResponse(error, "Impossible de mettre à jour la page.");
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const user = await requireAdminApiUser();
    const { id } = await params;
    return NextResponse.json(await removePage(id, user));
  } catch (error) {
    return toErrorResponse(error, "Impossible de supprimer la page.");
  }
}