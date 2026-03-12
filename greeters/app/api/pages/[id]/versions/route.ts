import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { getPageVersions } from "@/lib/services/pages";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "5"), 50);

    return NextResponse.json(
      await getPageVersions(id, user, Number.isFinite(limit) && limit > 0 ? limit : 5),
    );
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer l’historique des versions.");
  }
}