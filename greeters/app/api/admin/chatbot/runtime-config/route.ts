import { NextResponse } from "next/server";

import { buildCompiledChatbotPrompt, getRuntimeChatbotPrompt } from "@/lib/services/chatbot-prompts";

const INTERNAL_SECRET = process.env.CHATBOT_INTERNAL_SECRET;

export async function GET(request: Request) {
  const providedSecret = request.headers.get("x-greeters-internal-secret") ?? "";

  if (!INTERNAL_SECRET || providedSecret !== INTERNAL_SECRET) {
    return NextResponse.json({ detail: "Accès interne requis." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "draft" ? "draft" : "published";
  const locale = searchParams.get("locale") ?? "fr";

  try {
    const prompt = await getRuntimeChatbotPrompt(mode);
    return NextResponse.json({
      prompt,
      compiledPrompt: buildCompiledChatbotPrompt(prompt, locale),
      locale,
      mode,
    });
  } catch {
    return NextResponse.json({ detail: "Configuration chatbot indisponible." }, { status: 404 });
  }
}