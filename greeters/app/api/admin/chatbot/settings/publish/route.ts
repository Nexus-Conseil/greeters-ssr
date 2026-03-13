import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/lib/auth/permissions";
import { toErrorResponse } from "@/lib/api/route-errors";
import { publishChatbotDraft } from "@/lib/services/chatbot-prompts";

export async function POST(request: Request) {
  try {
    const user = await requireAdminApiUser();
    const payload = (await request.json().catch(() => ({}))) as { notes?: string };
    const published = await publishChatbotDraft(user.id, payload.notes);
    return NextResponse.json({ published });
  } catch (error) {
    return toErrorResponse(error, "Impossible de publier les consignes du chatbot.");
  }
}