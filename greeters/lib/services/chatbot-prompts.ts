import { prisma } from "@/lib/db/prisma";

type PromptStatus = "draft" | "published" | "archived";

export type ChatbotUrlEntry = {
  label: string;
  url: string;
};

export type ChatbotLanguageRule = {
  locale: string;
  guidance: string;
};

export type ChatbotPromptInput = {
  assistantRole: string;
  systemPrompt: string;
  toneGuidelines: string;
  businessRules: string;
  responseLimits: string;
  importantUrls: ChatbotUrlEntry[];
  bookingRules: string;
  forbiddenRules: string;
  outOfScopeRules: string;
  longResponseRules: string;
  brandVoiceRules: string;
  languageRules: ChatbotLanguageRule[];
  notes: string;
};

export type ChatbotPromptVersionPayload = ChatbotPromptInput & {
  id: string;
  status: PromptStatus;
  versionNumber: number;
  createdBy: string | null;
  createdAt: string;
  publishedBy: string | null;
  publishedAt: string | null;
};

export class ChatbotPromptServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ChatbotPromptServiceError";
  }
}

const DEFAULT_PROMPT: ChatbotPromptInput = {
  assistantRole:
    "Tu es l’assistant virtuel de Paris Greeters. Tu aides les visiteurs à comprendre l’association, le fonctionnement des balades et la réservation.",
  systemPrompt:
    "Réponds de façon utile, fiable, concise et chaleureuse. Donne toujours des informations concrètes, et propose une prochaine étape claire quand c’est pertinent.",
  toneGuidelines:
    "Ton chaleureux, rassurant, humain, accessible. Pas de jargon. Pas de ton commercial agressif. Préférer des phrases simples et naturelles.",
  businessRules:
    "Paris Greeters est une association de bénévoles. Les balades sont gratuites, durent généralement 2 à 3 heures, et concernent des groupes de 1 à 6 personnes maximum.",
  responseLimits:
    "Rester synthétique. Éviter les réponses trop longues. Si plusieurs points sont demandés, structurer en liste courte. Ne pas inventer d’informations absentes des consignes.",
  importantUrls: [
    { label: "Réservation", url: "https://gestion.parisiendunjour.fr/visits/new" },
    { label: "Site principal", url: "https://greeters.paris" },
  ],
  bookingRules:
    "Quand l’utilisateur souhaite réserver, rappeler qu’il faut effectuer la demande via le formulaire dédié, idéalement au moins 2 semaines à l’avance.",
  forbiddenRules:
    "Ne jamais promettre une disponibilité. Ne jamais inventer des tarifs, horaires ou politiques non confirmés. Ne pas fournir d’informations juridiques ou médicales.",
  outOfScopeRules:
    "Si la demande sort du périmètre Paris Greeters, le dire clairement, proposer une réponse courte si possible, puis recentrer sur ce que Paris Greeters peut aider à faire.",
  longResponseRules:
    "Si une réponse devient longue, commencer par l’essentiel puis proposer d’entrer dans le détail si l’utilisateur le souhaite.",
  brandVoiceRules:
    "Parler de Paris Greeters comme d’une association accueillante, passionnée par Paris et orientée rencontre humaine.",
  languageRules: [
    { locale: "fr", guidance: "Répondre en français, avec un ton chaleureux et naturel. Utiliser le masculin grammatical pour l’assistant en français." },
    { locale: "en", guidance: "Answer in English, warm and concise." },
    { locale: "de", guidance: "Antworte auf Deutsch, freundlich und klar." },
    { locale: "es", guidance: "Responde en español, con un tono cercano y útil." },
    { locale: "it", guidance: "Rispondi in italiano, in modo cordiale e chiaro." },
    { locale: "pt", guidance: "Responda em português, de forma cordial e concisa." },
  ],
  notes: "Configuration initiale importée depuis le prompt système historique du chatbot.",
};

const SUPPORTED_CHATBOT_LOCALES = new Set(["fr", "en", "de", "es", "it", "pt", "pt-pt", "ja", "nl", "zh-hans"]);

function normalizeChatbotLocale(value: string | null | undefined) {
  const normalized = trimText(value).toLowerCase();
  if (!normalized) {
    return "fr";
  }
  if (normalized === "pt-br") {
    return "pt";
  }
  return SUPPORTED_CHATBOT_LOCALES.has(normalized) ? normalized : "fr";
}

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrlEntries(value: unknown): ChatbotUrlEntry[] {
  if (!Array.isArray(value)) {
    return DEFAULT_PROMPT.importantUrls;
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const label = trimText((entry as { label?: unknown }).label);
      const url = trimText((entry as { url?: unknown }).url);
      if (!label || !url) {
        return null;
      }

      return { label, url } satisfies ChatbotUrlEntry;
    })
    .filter((entry): entry is ChatbotUrlEntry => Boolean(entry));
}

function normalizeLanguageRules(value: unknown): ChatbotLanguageRule[] {
  if (!Array.isArray(value)) {
    return DEFAULT_PROMPT.languageRules;
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const locale = normalizeChatbotLocale(trimText((entry as { locale?: unknown }).locale) || "fr");
      const guidance = trimText((entry as { guidance?: unknown }).guidance);

      if (!guidance) {
        return null;
      }

      return { locale, guidance } satisfies ChatbotLanguageRule;
    })
    .filter((entry): entry is ChatbotLanguageRule => Boolean(entry));
}

function sanitizePromptInput(input: unknown): ChatbotPromptInput {
  const payload = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    assistantRole: trimText(payload.assistantRole) || DEFAULT_PROMPT.assistantRole,
    systemPrompt: trimText(payload.systemPrompt) || DEFAULT_PROMPT.systemPrompt,
    toneGuidelines: trimText(payload.toneGuidelines) || DEFAULT_PROMPT.toneGuidelines,
    businessRules: trimText(payload.businessRules) || DEFAULT_PROMPT.businessRules,
    responseLimits: trimText(payload.responseLimits) || DEFAULT_PROMPT.responseLimits,
    importantUrls: normalizeUrlEntries(payload.importantUrls),
    bookingRules: trimText(payload.bookingRules) || DEFAULT_PROMPT.bookingRules,
    forbiddenRules: trimText(payload.forbiddenRules) || DEFAULT_PROMPT.forbiddenRules,
    outOfScopeRules: trimText(payload.outOfScopeRules) || DEFAULT_PROMPT.outOfScopeRules,
    longResponseRules: trimText(payload.longResponseRules) || DEFAULT_PROMPT.longResponseRules,
    brandVoiceRules: trimText(payload.brandVoiceRules) || DEFAULT_PROMPT.brandVoiceRules,
    languageRules: normalizeLanguageRules(payload.languageRules),
    notes: trimText(payload.notes),
  };
}

function mapPromptRecord(record: {
  id: string;
  status: string;
  versionNumber: number;
  assistantRole: string | null;
  systemPrompt: string;
  toneGuidelines: string | null;
  businessRules: string | null;
  responseLimits: string | null;
  importantUrls: unknown;
  bookingRules: string | null;
  forbiddenRules: string | null;
  outOfScopeRules: string | null;
  longResponseRules: string | null;
  brandVoiceRules: string | null;
  languageRules: unknown;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  publishedBy: string | null;
  publishedAt: Date | null;
}): ChatbotPromptVersionPayload {
  return {
    id: record.id,
    status: (record.status as PromptStatus) ?? "draft",
    versionNumber: record.versionNumber,
    assistantRole: record.assistantRole ?? DEFAULT_PROMPT.assistantRole,
    systemPrompt: record.systemPrompt,
    toneGuidelines: record.toneGuidelines ?? "",
    businessRules: record.businessRules ?? "",
    responseLimits: record.responseLimits ?? "",
    importantUrls: normalizeUrlEntries(record.importantUrls),
    bookingRules: record.bookingRules ?? "",
    forbiddenRules: record.forbiddenRules ?? "",
    outOfScopeRules: record.outOfScopeRules ?? "",
    longResponseRules: record.longResponseRules ?? "",
    brandVoiceRules: record.brandVoiceRules ?? "",
    languageRules: normalizeLanguageRules(record.languageRules),
    notes: record.notes ?? "",
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
    publishedBy: record.publishedBy,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
  };
}

async function findLatestPrompt(status: PromptStatus) {
  return prisma.chatbotPromptVersion.findFirst({
    where: { status },
    orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
  });
}

export async function ensureChatbotDraft(userId?: string) {
  const existingDraft = await findLatestPrompt("draft");
  if (existingDraft) {
    return mapPromptRecord(existingDraft);
  }

  const published = await findLatestPrompt("published");
  const baseInput = published
    ? mapPromptRecord(published)
    : {
        id: "",
        status: "draft" as const,
        versionNumber: 0,
        createdBy: null,
        createdAt: new Date().toISOString(),
        publishedBy: null,
        publishedAt: null,
        ...DEFAULT_PROMPT,
      };

  const draft = await prisma.chatbotPromptVersion.create({
    data: {
      status: "draft",
      versionNumber: published?.versionNumber ?? 0,
      assistantRole: baseInput.assistantRole,
      systemPrompt: baseInput.systemPrompt,
      toneGuidelines: baseInput.toneGuidelines,
      businessRules: baseInput.businessRules,
      responseLimits: baseInput.responseLimits,
      importantUrls: baseInput.importantUrls,
      bookingRules: baseInput.bookingRules,
      forbiddenRules: baseInput.forbiddenRules,
      outOfScopeRules: baseInput.outOfScopeRules,
      longResponseRules: baseInput.longResponseRules,
      brandVoiceRules: baseInput.brandVoiceRules,
      languageRules: baseInput.languageRules,
      notes: baseInput.notes,
      createdBy: userId,
    },
  });

  return mapPromptRecord(draft);
}

export async function getChatbotSettingsBundle(userId?: string) {
  const [draft, published, history] = await Promise.all([
    ensureChatbotDraft(userId),
    findLatestPrompt("published"),
    prisma.chatbotPromptVersion.findMany({
      where: { status: { not: "draft" } },
      orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
  ]);

  return {
    draft,
    published: published ? mapPromptRecord(published) : null,
    history: history.map(mapPromptRecord),
  };
}

export async function saveChatbotDraft(input: unknown, userId?: string) {
  const draft = await ensureChatbotDraft(userId);
  const payload = sanitizePromptInput(input);
  const updated = await prisma.chatbotPromptVersion.update({
    where: { id: draft.id },
    data: {
      assistantRole: payload.assistantRole,
      systemPrompt: payload.systemPrompt,
      toneGuidelines: payload.toneGuidelines,
      businessRules: payload.businessRules,
      responseLimits: payload.responseLimits,
      importantUrls: payload.importantUrls,
      bookingRules: payload.bookingRules,
      forbiddenRules: payload.forbiddenRules,
      outOfScopeRules: payload.outOfScopeRules,
      longResponseRules: payload.longResponseRules,
      brandVoiceRules: payload.brandVoiceRules,
      languageRules: payload.languageRules,
      notes: payload.notes,
      createdBy: userId ?? draft.createdBy,
    },
  });

  return mapPromptRecord(updated);
}

export async function publishChatbotDraft(userId: string, notes?: string) {
  const draft = await ensureChatbotDraft(userId);
  const currentPublished = await findLatestPrompt("published");
  const nextVersion = (currentPublished?.versionNumber ?? 0) + 1;

  const published = await prisma.$transaction(async (tx) => {
    await tx.chatbotPromptVersion.updateMany({
      where: { status: "published" },
      data: { status: "archived" },
    });

    const updated = await tx.chatbotPromptVersion.update({
      where: { id: draft.id },
      data: {
        status: "published",
        versionNumber: nextVersion,
        publishedBy: userId,
        publishedAt: new Date(),
        notes: trimText(notes) || draft.notes,
      },
    });

    return updated;
  });

  return mapPromptRecord(published);
}

export async function rollbackChatbotPrompt(versionId: string, userId: string) {
  const target = await prisma.chatbotPromptVersion.findUnique({ where: { id: versionId } });
  if (!target) {
    throw new ChatbotPromptServiceError(404, "Version de consignes introuvable.");
  }

  const currentPublished = await findLatestPrompt("published");
  const nextVersion = Math.max(currentPublished?.versionNumber ?? 0, target.versionNumber) + 1;

  const restored = await prisma.$transaction(async (tx) => {
    await tx.chatbotPromptVersion.updateMany({
      where: { status: { in: ["published", "draft"] } },
      data: { status: "archived" },
    });

    return tx.chatbotPromptVersion.create({
      data: {
        status: "published",
        versionNumber: nextVersion,
        assistantRole: target.assistantRole,
        systemPrompt: target.systemPrompt,
        toneGuidelines: target.toneGuidelines,
        businessRules: target.businessRules,
        responseLimits: target.responseLimits,
        importantUrls: normalizeUrlEntries(target.importantUrls),
        bookingRules: target.bookingRules,
        forbiddenRules: target.forbiddenRules,
        outOfScopeRules: target.outOfScopeRules,
        longResponseRules: target.longResponseRules,
        brandVoiceRules: target.brandVoiceRules,
        languageRules: normalizeLanguageRules(target.languageRules),
        notes: `Rollback depuis la version ${target.versionNumber}`,
        createdBy: userId,
        publishedBy: userId,
        publishedAt: new Date(),
      },
    });
  });

  return mapPromptRecord(restored);
}

export async function getRuntimeChatbotPrompt(mode: "draft" | "published" = "published") {
  const record = mode === "draft" ? await findLatestPrompt("draft") : await findLatestPrompt("published");
  if (record) {
    return mapPromptRecord(record);
  }

  if (mode === "draft") {
    return ensureChatbotDraft();
  }

  throw new ChatbotPromptServiceError(404, "Aucune configuration chatbot publiée.");
}

export function buildCompiledChatbotPrompt(config: ChatbotPromptInput, locale: string) {
  const normalizedLocale = normalizeChatbotLocale(locale);
  const languageRule = config.languageRules.find((entry) => entry.locale === normalizedLocale)?.guidance ?? "Répondre dans la langue de l’utilisateur quand elle est disponible.";
  const urlsBlock = config.importantUrls.map((entry) => `- ${entry.label}: ${entry.url}`).join("\n");

  const sections = [
    ["Rôle de l’assistant", config.assistantRole],
    ["Prompt système principal", config.systemPrompt],
    ["Consignes de ton", config.toneGuidelines],
    ["Comment parler de Paris Greeters", config.brandVoiceRules],
    ["Règles métier", config.businessRules],
    ["Règles de réservation", config.bookingRules],
    ["URLs importantes à citer", urlsBlock],
    ["Limites de réponse", config.responseLimits],
    ["Réponses hors périmètre", config.outOfScopeRules],
    ["Gestion des réponses trop longues", config.longResponseRules],
    ["Interdits", config.forbiddenRules],
    [`Consigne langue (${normalizedLocale})`, languageRule],
  ]
    .filter(([, value]) => trimText(value))
    .map(([title, value]) => `${title}:\n${value}`);

  return sections.join("\n\n");
}