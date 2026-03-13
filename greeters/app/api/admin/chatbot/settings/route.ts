import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { getChatbotSettingsBundle, saveChatbotDraft } from "@/lib/services/chatbot-prompts";

export async function GET() {
  try {
    const user = await requireAdminApiUser();
    return NextResponse.json(await getChatbotSettingsBundle(user.id));
  } catch (error) {
    return toErrorResponse(error, "Impossible de récupérer les consignes du chatbot.");
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdminApiUser();
    const draft = await saveChatbotDraft(await request.json(), user.id);
    return NextResponse.json({ draft });
  } catch (error) {
    return toErrorResponse(error, "Impossible d’enregistrer le brouillon des consignes du chatbot.");
  }
}