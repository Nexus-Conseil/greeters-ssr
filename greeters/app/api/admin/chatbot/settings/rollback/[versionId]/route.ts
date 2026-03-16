import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { rollbackChatbotPrompt } from "@/lib/services/chatbot-prompts";

export async function POST(_request: Request, context: { params: Promise<{ versionId: string }> }) {
  try {
    const user = await requireAdminApiUser();
    const { versionId } = await context.params;
    const published = await rollbackChatbotPrompt(versionId, user.id);
    return NextResponse.json({ published });
  } catch (error) {
    return toErrorResponse(error, "Impossible de restaurer cette version des consignes.");
  }
}