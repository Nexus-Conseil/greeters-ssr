import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/route-errors";
import { requireEditorApiUser } from "@/lib/auth/permissions";
import { generatePageWithAi } from "@/lib/services/ai-page-generator";

export async function POST(request: Request) {
  try {
    const user = await requireEditorApiUser();
    return NextResponse.json(await generatePageWithAi(await request.json(), user));
  } catch (error) {
    return toErrorResponse(error, "Impossible de générer la page via IA.");
  }
}