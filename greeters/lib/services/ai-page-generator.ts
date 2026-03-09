import { randomUUID } from "crypto";

import { AuthError } from "@/lib/auth/permissions";
import { normalizeLocale, type AppLocale } from "@/lib/i18n/config";
import {
  AiChatRole,
  createAiChatMessageRecord,
  createAiChatSessionRecord,
  findAiChatSessionById,
  updateAiChatSessionRecord,
} from "@/lib/repositories/ai-chat";
import { createPage, PagesServiceError, type PageInput } from "@/lib/services/pages";
import type { AuthUser } from "@/lib/auth/session";

type AiChatResponse = {
  sessionId: string;
  generatedPage: PageInput;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new PagesServiceError(500, "GEMINI_API_KEY est manquante.");
  }
  return apiKey;
}

function createJsonSchema() {
  return {
    type: "object",
    required: ["locale", "title", "slug", "metaDescription", "metaKeywords", "isInMenu", "menuOrder", "menuLabel", "sections"],
    properties: {
      locale: { type: "string" },
      title: { type: "string" },
      slug: { type: "string" },
      metaDescription: { type: "string" },
      metaKeywords: { type: "string" },
      isInMenu: { type: "boolean" },
      menuOrder: { type: "number" },
      menuLabel: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name", "layout", "background", "backgroundImage", "order", "blocks"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            layout: { type: "string" },
            background: { type: "string" },
            backgroundImage: { type: ["string", "null"] },
            order: { type: "number" },
            blocks: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "type", "order", "content"],
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  order: { type: "number" },
                  content: { type: "object" },
                },
              },
            },
          },
        },
      },
    },
  };
}

async function generateStructuredDraft(prompt: string, locale: AppLocale) {
  const apiKey = getGeminiApiKey();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `Tu es le directeur artistique du CMS Greeters Paris. Tu génères uniquement du JSON valide pour une page touristique cohérente avec le site, en variant à chaque fois la structure visuelle (hero, centered, cards, two-column, default) et l’ordre des blocs. La langue cible est ${locale}. Exclure mentions légales, cookies, presse, contact institutionnel. Créer des contenus utiles à des touristes. Toujours prévoir entre 3 et 6 sections et au moins un call-to-action.`,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Crée une page CMS complète à partir de cette demande : ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: createJsonSchema(),
      },
    }),
  });

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!response.ok || typeof text !== "string") {
    throw new PagesServiceError(502, "Gemini n’a pas retourné de page exploitable.");
  }

  return JSON.parse(text) as PageInput;
}

function sanitizeGeneratedPage(page: PageInput, locale: AppLocale): PageInput {
  return {
    ...page,
    locale,
    isInMenu: Boolean(page.isInMenu),
    menuOrder: Number(page.menuOrder ?? 0),
    sections: Array.isArray(page.sections)
      ? page.sections.map((section, sectionIndex) => ({
          ...section,
          id: section.id || `section-${randomUUID()}`,
          order: typeof section.order === "number" ? section.order : sectionIndex,
          backgroundImage: section.backgroundImage ?? null,
          blocks: Array.isArray(section.blocks)
            ? section.blocks.map((block, blockIndex) => ({
                ...block,
                id: block.id || `block-${randomUUID()}`,
                order: typeof block.order === "number" ? block.order : blockIndex,
              }))
            : [],
        }))
      : [],
  };
}

export async function generatePageWithAi(input: { sessionId?: string; prompt: string; locale?: string }, user: AuthUser): Promise<AiChatResponse> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new PagesServiceError(400, "Le prompt IA est obligatoire.");
  }

  const locale = normalizeLocale(input.locale);
  const session = input.sessionId ? await findAiChatSessionById(input.sessionId) : null;

  if (input.sessionId && !session) {
    throw new PagesServiceError(404, "Session IA introuvable.");
  }

  const sessionId = session?.id ?? (await createAiChatSessionRecord({
    createdBy: user.id,
    locale,
    title: prompt.slice(0, 120),
  })).id;

  await createAiChatMessageRecord({
    sessionId,
    role: AiChatRole.USER,
    content: prompt,
  });

  const generatedPage = sanitizeGeneratedPage(await generateStructuredDraft(prompt, locale), locale);

  await createAiChatMessageRecord({
    sessionId,
    role: AiChatRole.ASSISTANT,
    content: `Page générée automatiquement pour ${locale}.`,
    generatedPage: generatedPage as unknown as object,
  });

  const updatedSession = await updateAiChatSessionRecord(sessionId, {
    locale,
    latestDraft: generatedPage as unknown as object,
    title: generatedPage.title,
    updatedAt: new Date(),
  });

  const hydrated = await findAiChatSessionById(updatedSession.id);

  if (!hydrated) {
    throw new PagesServiceError(500, "Impossible de relire la session IA.");
  }

  return {
    sessionId,
    generatedPage,
    messages: hydrated.messages.map((message) => ({
      id: message.id,
      role: message.role === AiChatRole.USER ? "user" : "assistant",
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

export async function getAiChatSession(sessionId: string, user: AuthUser) {
  const session = await findAiChatSessionById(sessionId);
  if (!session) {
    throw new PagesServiceError(404, "Session IA introuvable.");
  }
  if (session.createdBy !== user.id && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new AuthError(403, "Accès à la session IA refusé.");
  }

  return {
    id: session.id,
    locale: normalizeLocale(session.locale),
    latestDraft: session.latestDraft,
    messages: session.messages.map((message) => ({
      id: message.id,
      role: message.role === AiChatRole.USER ? "user" : "assistant",
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      generatedPage: message.generatedPage,
    })),
  };
}

export async function createPageFromAiDraft(draft: unknown, user: AuthUser) {
  return createPage(draft, user);
}