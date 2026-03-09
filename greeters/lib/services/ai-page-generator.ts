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

type AiSectionPlan = {
  name: string;
  layout: "default" | "hero" | "two-column" | "cards" | "centered";
  background: "white" | "gray" | "green" | "image";
  backgroundImage: string | null;
  heading: string;
  body: string;
  bulletPoints: string[];
  imageUrl: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
};

type AiPagePlan = {
  locale: string;
  title: string;
  slug: string;
  metaDescription: string;
  metaKeywords: string;
  isInMenu: boolean;
  menuOrder: number;
  menuLabel: string;
  sections: AiSectionPlan[];
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
          required: ["name", "layout", "background", "backgroundImage", "heading", "body", "bulletPoints", "imageUrl", "imageAlt", "ctaLabel", "ctaHref"],
          properties: {
            name: { type: "string" },
            layout: { type: "string", enum: ["default", "hero", "two-column", "cards", "centered"] },
            background: { type: "string", enum: ["white", "gray", "green", "image"] },
            backgroundImage: { type: "string", nullable: true },
            heading: { type: "string" },
            body: { type: "string" },
            bulletPoints: {
              type: "array",
              items: { type: "string" },
            },
            imageUrl: { type: "string" },
            imageAlt: { type: "string" },
            ctaLabel: { type: "string" },
            ctaHref: { type: "string" },
          },
        },
      },
    },
  };
}

function extractJsonString(rawText: string) {
  const trimmed = rawText.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new PagesServiceError(502, "Gemini a renvoyé une structure JSON illisible.");
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];
}

function toTextBlockText(body: string, bulletPoints: string[]) {
  const parts = [body.trim(), ...bulletPoints.map((entry) => `• ${entry.trim()}`)].filter(Boolean);
  return parts.join("\n\n");
}

function convertPlanToPage(plan: AiPagePlan, locale: AppLocale): PageInput {
  const sections = (Array.isArray(plan.sections) ? plan.sections : []).slice(0, 6).map((section, sectionIndex) => {
    const blocks: PageInput["sections"][number]["blocks"] = [];
    const heading = asString(section.heading, asString(section.name, `Section ${sectionIndex + 1}`));
    const body = asString(section.body);
    const bulletPoints = asStringArray(section.bulletPoints).slice(0, 4);
    const imageUrl = asString(section.imageUrl);
    const imageAlt = asString(section.imageAlt);
    const ctaLabel = asString(section.ctaLabel);
    const ctaHref = asString(section.ctaHref, "/");

    blocks.push({
      id: `block-${randomUUID()}`,
      type: "heading",
      order: blocks.length,
      content: {
        text: heading,
        level: sectionIndex === 0 && section.layout === "hero" ? "h1" : "h2",
      },
    });

    if (section.layout === "cards" && bulletPoints.length > 0) {
      bulletPoints.forEach((point) => {
        blocks.push({
          id: `block-${randomUUID()}`,
          type: "text",
          order: blocks.length,
          content: { text: point },
        });
      });
    } else if (body || bulletPoints.length > 0) {
      blocks.push({
        id: `block-${randomUUID()}`,
        type: "text",
        order: blocks.length,
        content: { text: toTextBlockText(body, bulletPoints) },
      });
    }

    if (imageUrl) {
      blocks.push({
        id: `block-${randomUUID()}`,
        type: "image",
        order: blocks.length,
        content: {
          src: imageUrl,
          alt: imageAlt || heading,
          caption: section.layout === "cards" ? "" : section.name,
        },
      });
    }

    if (ctaLabel) {
      blocks.push({
        id: `block-${randomUUID()}`,
        type: "button",
        order: blocks.length,
        content: {
          text: ctaLabel,
          href: ctaHref || "/",
          style: sectionIndex === 0 ? "primary" : "secondary",
        },
      });
    }

    return {
      id: `section-${randomUUID()}`,
      name: asString(section.name, `Section ${sectionIndex + 1}`),
      layout: section.layout,
      background: section.background,
      backgroundImage: section.background === "image" ? asString(section.backgroundImage) || imageUrl || null : null,
      blocks,
      order: sectionIndex,
    };
  });

  return {
    locale,
    title: asString(plan.title, "Nouvelle page touristique"),
    slug: asString(plan.slug, `page-touristique-${randomUUID().slice(0, 8)}`),
    metaDescription: asString(plan.metaDescription, "Découvrez une page touristique générée automatiquement par le CMS."),
    metaKeywords: asString(plan.metaKeywords, "paris, greeters, visite, tourisme"),
    isInMenu: Boolean(plan.isInMenu),
    menuOrder: Number.isFinite(plan.menuOrder) ? Number(plan.menuOrder) : 0,
    menuLabel: asString(plan.menuLabel, asString(plan.title, "Nouvelle page")),
    sections,
  };
}

async function generateStructuredDraft(prompt: string, locale: AppLocale) {
  const apiKey = getGeminiApiKey();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `Tu es le directeur artistique du CMS Greeters Paris. Tu crées des pages touristiques élégantes, utiles aux visiteurs, cohérentes avec le site mais avec des structures variées d’une page à l’autre. Réponds uniquement avec un JSON valide. Langue cible: ${locale}. Exclure mentions légales, cookies, presse, contact institutionnel. N’utiliser que les layouts default, hero, two-column, cards, centered et les backgrounds white, gray, green, image. Toujours prévoir entre 3 et 6 sections, au moins un call-to-action, des contenus concrets, un ton chaleureux et des informations pratiques. Les URLs d’image doivent être de vraies URLs https://images.unsplash.com/... ou rester vides.`,
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
    const message = payload?.error?.message;
    if (typeof message === "string" && response.status === 429) {
      throw new PagesServiceError(429, `Quota Gemini épuisé : ${message}`);
    }

    if (typeof message === "string") {
      throw new PagesServiceError(response.status >= 400 ? response.status : 502, `Gemini : ${message}`);
    }

    throw new PagesServiceError(502, "Gemini n’a pas retourné de page exploitable.");
  }

  const parsed = JSON.parse(extractJsonString(text)) as AiPagePlan;
  return convertPlanToPage(parsed, locale);
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