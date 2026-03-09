import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireEditorApiUser } from "@/lib/auth/permissions";
import { getAiChatSession } from "@/lib/services/ai-page-generator";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const user = await requireEditorApiUser();
    const { sessionId } = await params;
    return NextResponse.json(await getAiChatSession(sessionId, user));
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer la session IA.");
  }
}