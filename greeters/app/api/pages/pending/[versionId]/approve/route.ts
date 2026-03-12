import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { approvePendingChange } from "@/lib/services/pages";

type RouteContext = {
  params: Promise<{
    versionId: string;
  }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  try {
    const user = await requireAdminApiUser();
    const { versionId } = await params;
    return NextResponse.json(await approvePendingChange(versionId, user));
  } catch (error) {
    return toErrorResponse(error, "Impossible d’approuver cette version.");
  }
}