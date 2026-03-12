import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { rollbackPage } from "@/lib/services/pages";

type RouteContext = {
  params: Promise<{
    id: string;
    versionNumber: string;
  }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  try {
    const user = await requireAdminApiUser();
    const { id, versionNumber } = await params;
    const targetVersion = Number(versionNumber);

    if (!Number.isInteger(targetVersion) || targetVersion <= 0) {
      return NextResponse.json({ detail: "Numéro de version invalide." }, { status: 400 });
    }

    return NextResponse.json(await rollbackPage(id, targetVersion, user));
  } catch (error) {
    return toErrorResponse(error, "Impossible de restaurer cette version.");
  }
}