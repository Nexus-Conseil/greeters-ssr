import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/permissions";
import { AdminDocumentsServiceError } from "@/lib/services/admin-documents";
import { AdminUsersServiceError } from "@/lib/services/admin-users";
import { ChatbotPromptServiceError } from "@/lib/services/chatbot-prompts";
import { PagesServiceError } from "@/lib/services/pages";

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthError || error instanceof PagesServiceError || error instanceof ChatbotPromptServiceError || error instanceof AdminUsersServiceError || error instanceof AdminDocumentsServiceError) {
    return NextResponse.json({ detail: error.message }, { status: error.statusCode });
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ detail: "Le corps JSON est invalide." }, { status: 400 });
  }

  return NextResponse.json({ detail: fallbackMessage }, { status: 500 });
}