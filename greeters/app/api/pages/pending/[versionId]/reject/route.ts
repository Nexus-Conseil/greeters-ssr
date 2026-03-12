import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { rejectPendingChange } from "@/lib/services/pages";

type RouteContext = {
  params: Promise<{
    versionId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireAdminApiUser();
    const { versionId } = await params;
    const payload = await request.json().catch(() => ({}));
    const reason = typeof payload?.reason === "string" && payload.reason.trim() ? payload.reason.trim() : null;

    return NextResponse.json(await rejectPendingChange(versionId, reason, user));
  } catch (error) {
    return toErrorResponse(error, "Impossible de rejeter cette version.");
  }
}