import { PageStatus, type Page, type PageVersion, type Prisma } from "@prisma/client";
import { cache } from "react";

import { AuthError, isAdminRole } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/session";
import { deletePageContentByPageId, upsertPageContentRecord } from "@/lib/repositories/page-contents";
import { deletePageEditsByPageId } from "@/lib/repositories/page-edits";
import { deletePagePreviewsByPageId } from "@/lib/repositories/page-previews";
import {
  createPageVersionRecord,
  deleteVersionsForPage,
  findPageVersion,
  findPageVersionById,
  listPageVersions,
  listPendingPageVersions,
  listVersionsForPublishedStates,
  updatePageVersionStatus,
} from "@/lib/repositories/page-versions";
import {
  countPagesByStatus,
  createPageRecord,
  deletePageRecord,
  findPageById,
  findPageBySlug,
  listPages,
  listPagesByIds,
  listPublishedPages,
  updatePageRecord,
} from "@/lib/repositories/pages";
import { listUsersByIds } from "@/lib/repositories/users";
import { cleanupOrphanedManagedImages } from "@/lib/media/managed-images";
import { syncMenuFromPublishedPages } from "@/lib/services/menu";
import { automatePageSeoAndOg } from "@/lib/services/page-automation";
import { normalizeLocale, type AppLocale } from "@/lib/i18n/config";

export type CmsBlock = {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
};

export type CmsSection = {
  id: string;
  name: string;
  layout: string;
  background: string;
  backgroundImage: string | null;
  blocks: CmsBlock[];
  order: number;
};

export type SeoImageRecommendation = {
  blockId: string;
  currentSrc: string;
  suggestedFileName: string | null;
  suggestedAlt: string | null;
  suggestedTitle: string | null;
  reason: string | null;
};

export type PageInput = {
  locale: AppLocale;
  title: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robotsDirective: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  ogImageAlt: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImageUrl: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string | null;
  schemaOrgJson: string | null;
  imageRecommendations: SeoImageRecommendation[];
  sitemapPriority: number | null;
  sitemapChangeFreq: string | null;
  sections: CmsSection[];
  isInMenu: boolean;
  menuOrder: number;
  menuLabel: string | null;
};

export type PageUpdateInput = Partial<PageInput> & {
  status?: PageApiStatus;
};

export type PageApiStatus = "draft" | "pending" | "published" | "archived";

export type PageResponse = PageInput & {
  id: string;
  status: PageApiStatus;
  currentVersion: number;
  publishedVersion: number | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
};

export type PendingChangeResponse = {
  versionId: string;
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  versionNumber: number;
  editorName: string;
  editorEmail: string;
  createdAt: string;
  currentContent: PageInput | null;
  pendingContent: PageInput;
};

export type PageVersionResponse = {
  id: string;
  versionNumber: number;
  status: PageApiStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  isCurrent: boolean;
  isPublished: boolean;
  content: PageInput;
};

export class PagesServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PagesServiceError";
  }
}

const STATUS_TO_API: Record<PageStatus, PageApiStatus> = {
  [PageStatus.DRAFT]: "draft",
  [PageStatus.PENDING]: "pending",
  [PageStatus.PUBLISHED]: "published",
  [PageStatus.ARCHIVED]: "archived",
};

const STATUS_FROM_API: Record<PageApiStatus, PageStatus> = {
  draft: PageStatus.DRAFT,
  pending: PageStatus.PENDING,
  published: PageStatus.PUBLISHED,
  archived: PageStatus.ARCHIVED,
};

function asRecord(input: unknown, message: string) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new PagesServiceError(400, message);
  }

  return input as Record<string, unknown>;
}

function coerceString(input: unknown, fallback = "") {
  return typeof input === "string" ? input.trim() : fallback;
}

function coerceNumber(input: unknown, fallback = 0) {
  return typeof input === "number" && Number.isFinite(input) ? input : fallback;
}

function parseOptionalNumber(input: unknown) {
  return typeof input === "number" && Number.isFinite(input) ? input : null;
}

function normalizeSlug(raw: string) {
  const cleaned = raw.trim().toLowerCase();

  if (!cleaned || cleaned === "/") {
    return "/";
  }

  const segments = cleaned
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  return segments.join("/");
}

function parseBlocks(input: unknown): CmsBlock[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((block, index) => {
    const candidate = asRecord(block, "Bloc invalide.");
    const content = candidate.content;

    return {
      id: coerceString(candidate.id, crypto.randomUUID()),
      type: coerceString(candidate.type, "text"),
      content:
        content && typeof content === "object" && !Array.isArray(content)
          ? { ...(content as Record<string, unknown>) }
          : {},
      order: coerceNumber(candidate.order, index),
    } satisfies CmsBlock;
  });
}

function parseSections(input: unknown): CmsSection[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((section, index) => {
    const candidate = asRecord(section, "Section invalide.");
    const backgroundImage = candidate.backgroundImage ?? candidate.background_image;

    return {
      id: coerceString(candidate.id, crypto.randomUUID()),
      name: coerceString(candidate.name, `Section ${index + 1}`),
      layout: coerceString(candidate.layout, "default"),
      background: coerceString(candidate.background, "white"),
      backgroundImage: typeof backgroundImage === "string" && backgroundImage.trim() ? backgroundImage.trim() : null,
      blocks: parseBlocks(candidate.blocks),
      order: coerceNumber(candidate.order, index),
    } satisfies CmsSection;
  });
}

function parseOptionalString(input: unknown) {
  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();
  return value ? value : null;
}

function parseMenuOrder(input: unknown) {
  return coerceNumber(input, 0);
}

function parseImageRecommendations(input: unknown): SeoImageRecommendation[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((entry) => {
    const candidate = asRecord(entry, "Recommandation image invalide.");
    return {
      blockId: coerceString(candidate.blockId),
      currentSrc: coerceString(candidate.currentSrc),
      suggestedFileName: parseOptionalString(candidate.suggestedFileName),
      suggestedAlt: parseOptionalString(candidate.suggestedAlt),
      suggestedTitle: parseOptionalString(candidate.suggestedTitle),
      reason: parseOptionalString(candidate.reason),
    } satisfies SeoImageRecommendation;
  });
}

function parseStatus(input: unknown) {
  if (typeof input !== "string") {
    return undefined;
  }

  const normalized = input.trim().toLowerCase() as PageApiStatus;
  return STATUS_FROM_API[normalized] ? normalized : undefined;
}

export function parsePageInput(input: unknown): PageInput {
  const candidate = asRecord(input, "Le corps de requête est invalide.");
  const locale = normalizeLocale(typeof candidate.locale === "string" ? candidate.locale : undefined);
  const title = coerceString(candidate.title);
  const slug = normalizeSlug(coerceString(candidate.slug));

  if (!title) {
    throw new PagesServiceError(400, "Le titre est obligatoire.");
  }

  if (!slug) {
    throw new PagesServiceError(400, "Le slug est obligatoire.");
  }

  return {
    locale,
    title,
    slug,
    metaTitle: parseOptionalString(candidate.metaTitle ?? candidate.meta_title),
    metaDescription: parseOptionalString(candidate.metaDescription ?? candidate.meta_description),
    metaKeywords: parseOptionalString(candidate.metaKeywords ?? candidate.meta_keywords),
    canonicalUrl: parseOptionalString(candidate.canonicalUrl ?? candidate.canonical_url),
    robotsDirective: parseOptionalString(candidate.robotsDirective ?? candidate.robots_directive),
    ogTitle: parseOptionalString(candidate.ogTitle ?? candidate.og_title),
    ogDescription: parseOptionalString(candidate.ogDescription ?? candidate.og_description),
    ogImageUrl: parseOptionalString(candidate.ogImageUrl ?? candidate.og_image_url),
    ogImageAlt: parseOptionalString(candidate.ogImageAlt ?? candidate.og_image_alt),
    twitterTitle: parseOptionalString(candidate.twitterTitle ?? candidate.twitter_title),
    twitterDescription: parseOptionalString(candidate.twitterDescription ?? candidate.twitter_description),
    twitterImageUrl: parseOptionalString(candidate.twitterImageUrl ?? candidate.twitter_image_url),
    focusKeyword: parseOptionalString(candidate.focusKeyword ?? candidate.focus_keyword),
    secondaryKeywords: parseOptionalString(candidate.secondaryKeywords ?? candidate.secondary_keywords),
    schemaOrgJson: parseOptionalString(candidate.schemaOrgJson ?? candidate.schema_org_json),
    imageRecommendations: parseImageRecommendations(candidate.imageRecommendations ?? candidate.image_recommendations),
    sitemapPriority: parseOptionalNumber(candidate.sitemapPriority ?? candidate.sitemap_priority),
    sitemapChangeFreq: parseOptionalString(candidate.sitemapChangeFreq ?? candidate.sitemap_change_freq),
    sections: parseSections(candidate.sections),
    isInMenu: Boolean(candidate.isInMenu ?? candidate.is_in_menu ?? false),
    menuOrder: parseMenuOrder(candidate.menuOrder ?? candidate.menu_order),
    menuLabel: parseOptionalString(candidate.menuLabel ?? candidate.menu_label),
  };
}

function parsePageUpdateInput(input: unknown): PageUpdateInput {
  const candidate = asRecord(input, "Le corps de requête est invalide.");
  const payload: PageUpdateInput = {};

  if ("title" in candidate) {
    const title = coerceString(candidate.title);
    if (!title) {
      throw new PagesServiceError(400, "Le titre ne peut pas être vide.");
    }
    payload.title = title;
  }

  if ("locale" in candidate) {
    payload.locale = normalizeLocale(typeof candidate.locale === "string" ? candidate.locale : undefined);
  }

  if ("slug" in candidate) {
    payload.slug = normalizeSlug(coerceString(candidate.slug));
  }

  if ("metaDescription" in candidate || "meta_description" in candidate) {
    payload.metaDescription = parseOptionalString(candidate.metaDescription ?? candidate.meta_description);
  }

  if ("metaTitle" in candidate || "meta_title" in candidate) {
    payload.metaTitle = parseOptionalString(candidate.metaTitle ?? candidate.meta_title);
  }

  if ("metaKeywords" in candidate || "meta_keywords" in candidate) {
    payload.metaKeywords = parseOptionalString(candidate.metaKeywords ?? candidate.meta_keywords);
  }

  if ("canonicalUrl" in candidate || "canonical_url" in candidate) {
    payload.canonicalUrl = parseOptionalString(candidate.canonicalUrl ?? candidate.canonical_url);
  }

  if ("robotsDirective" in candidate || "robots_directive" in candidate) {
    payload.robotsDirective = parseOptionalString(candidate.robotsDirective ?? candidate.robots_directive);
  }

  if ("ogTitle" in candidate || "og_title" in candidate) {
    payload.ogTitle = parseOptionalString(candidate.ogTitle ?? candidate.og_title);
  }

  if ("ogDescription" in candidate || "og_description" in candidate) {
    payload.ogDescription = parseOptionalString(candidate.ogDescription ?? candidate.og_description);
  }

  if ("ogImageUrl" in candidate || "og_image_url" in candidate) {
    payload.ogImageUrl = parseOptionalString(candidate.ogImageUrl ?? candidate.og_image_url);
  }

  if ("ogImageAlt" in candidate || "og_image_alt" in candidate) {
    payload.ogImageAlt = parseOptionalString(candidate.ogImageAlt ?? candidate.og_image_alt);
  }

  if ("twitterTitle" in candidate || "twitter_title" in candidate) {
    payload.twitterTitle = parseOptionalString(candidate.twitterTitle ?? candidate.twitter_title);
  }

  if ("twitterDescription" in candidate || "twitter_description" in candidate) {
    payload.twitterDescription = parseOptionalString(candidate.twitterDescription ?? candidate.twitter_description);
  }

  if ("twitterImageUrl" in candidate || "twitter_image_url" in candidate) {
    payload.twitterImageUrl = parseOptionalString(candidate.twitterImageUrl ?? candidate.twitter_image_url);
  }

  if ("focusKeyword" in candidate || "focus_keyword" in candidate) {
    payload.focusKeyword = parseOptionalString(candidate.focusKeyword ?? candidate.focus_keyword);
  }

  if ("secondaryKeywords" in candidate || "secondary_keywords" in candidate) {
    payload.secondaryKeywords = parseOptionalString(candidate.secondaryKeywords ?? candidate.secondary_keywords);
  }

  if ("schemaOrgJson" in candidate || "schema_org_json" in candidate) {
    payload.schemaOrgJson = parseOptionalString(candidate.schemaOrgJson ?? candidate.schema_org_json);
  }

  if ("imageRecommendations" in candidate || "image_recommendations" in candidate) {
    payload.imageRecommendations = parseImageRecommendations(candidate.imageRecommendations ?? candidate.image_recommendations);
  }

  if ("sitemapPriority" in candidate || "sitemap_priority" in candidate) {
    payload.sitemapPriority = parseOptionalNumber(candidate.sitemapPriority ?? candidate.sitemap_priority);
  }

  if ("sitemapChangeFreq" in candidate || "sitemap_change_freq" in candidate) {
    payload.sitemapChangeFreq = parseOptionalString(candidate.sitemapChangeFreq ?? candidate.sitemap_change_freq);
  }

  if ("sections" in candidate) {
    payload.sections = parseSections(candidate.sections);
  }

  if ("isInMenu" in candidate || "is_in_menu" in candidate) {
    payload.isInMenu = Boolean(candidate.isInMenu ?? candidate.is_in_menu);
  }

  if ("menuOrder" in candidate || "menu_order" in candidate) {
    payload.menuOrder = parseMenuOrder(candidate.menuOrder ?? candidate.menu_order);
  }

  if ("menuLabel" in candidate || "menu_label" in candidate) {
    payload.menuLabel = parseOptionalString(candidate.menuLabel ?? candidate.menu_label);
  }

  if ("status" in candidate) {
    const status = parseStatus(candidate.status);

    if (!status) {
      throw new PagesServiceError(400, "Statut de page invalide.");
    }

    payload.status = status;
  }

  if (Object.keys(payload).length === 0) {
    throw new PagesServiceError(400, "Aucune modification n’a été fournie.");
  }

  return payload;
}

function serializeContent(page: Pick<Page, "locale" | "title" | "slug" | "metaTitle" | "metaDescription" | "metaKeywords" | "canonicalUrl" | "robotsDirective" | "ogTitle" | "ogDescription" | "ogImageUrl" | "ogImageAlt" | "twitterTitle" | "twitterDescription" | "twitterImageUrl" | "focusKeyword" | "secondaryKeywords" | "schemaOrgJson" | "imageRecommendations" | "sitemapPriority" | "sitemapChangeFreq" | "sections" | "isInMenu" | "menuOrder" | "menuLabel">): PageInput {
  return {
    locale: normalizeLocale(page.locale),
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    metaKeywords: page.metaKeywords,
    canonicalUrl: page.canonicalUrl,
    robotsDirective: page.robotsDirective,
    ogTitle: page.ogTitle,
    ogDescription: page.ogDescription,
    ogImageUrl: page.ogImageUrl,
    ogImageAlt: page.ogImageAlt,
    twitterTitle: page.twitterTitle,
    twitterDescription: page.twitterDescription,
    twitterImageUrl: page.twitterImageUrl,
    focusKeyword: page.focusKeyword,
    secondaryKeywords: page.secondaryKeywords,
    schemaOrgJson: page.schemaOrgJson,
    imageRecommendations: parseImageRecommendations(page.imageRecommendations),
    sitemapPriority: page.sitemapPriority,
    sitemapChangeFreq: page.sitemapChangeFreq,
    sections: parseSections(page.sections),
    isInMenu: page.isInMenu,
    menuOrder: page.menuOrder,
    menuLabel: page.menuLabel,
  };
}

function serializePage(page: Page): PageResponse {
  return {
    id: page.id,
    ...serializeContent(page),
    status: STATUS_TO_API[page.status],
    currentVersion: page.currentVersion,
    publishedVersion: page.publishedVersion,
    createdBy: page.createdBy,
    createdAt: page.createdAt.toISOString(),
    updatedBy: page.updatedBy,
    updatedAt: page.updatedAt?.toISOString() ?? null,
  };
}

function serializeVersionContent(version: Pick<PageVersion, "content">): PageInput {
  return parsePageInput(version.content);
}

function toJsonValue(content: PageInput) {
  return {
    locale: content.locale,
    title: content.title,
    slug: content.slug,
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription,
    metaKeywords: content.metaKeywords,
    canonicalUrl: content.canonicalUrl,
    robotsDirective: content.robotsDirective,
    ogTitle: content.ogTitle,
    ogDescription: content.ogDescription,
    ogImageUrl: content.ogImageUrl,
    ogImageAlt: content.ogImageAlt,
    twitterTitle: content.twitterTitle,
    twitterDescription: content.twitterDescription,
    twitterImageUrl: content.twitterImageUrl,
    focusKeyword: content.focusKeyword,
    secondaryKeywords: content.secondaryKeywords,
    schemaOrgJson: content.schemaOrgJson,
    imageRecommendations: content.imageRecommendations,
    sitemapPriority: content.sitemapPriority,
    sitemapChangeFreq: content.sitemapChangeFreq,
    sections: content.sections,
    isInMenu: content.isInMenu,
    menuOrder: content.menuOrder,
    menuLabel: content.menuLabel,
  } as Prisma.InputJsonValue;
}

async function ensureSlugAvailable(slug: string, locale: AppLocale, currentPageId?: string) {
  const existing = await findPageBySlug(slug, locale);

  if (existing && existing.id !== currentPageId) {
    throw new PagesServiceError(400, "Ce slug est déjà utilisé.");
  }
}

function resolveNextStatus(user: AuthUser, currentStatus: PageStatus, requestedStatus?: PageApiStatus) {
  if (!isAdminRole(user.role)) {
    return PageStatus.PENDING;
  }

  if (requestedStatus) {
    return STATUS_FROM_API[requestedStatus];
  }

  return currentStatus;
}

export function parsePageStatusFilter(input: string | null) {
  if (!input) {
    return undefined;
  }

  const parsed = parseStatus(input);

  if (!parsed) {
    throw new PagesServiceError(400, "Filtre de statut invalide.");
  }

  return STATUS_FROM_API[parsed];
}

export async function getPagesList(input: { locale?: AppLocale; status?: PageStatus; skip?: number; limit?: number }) {
  const pages = await listPages(input);
  return pages.map(serializePage);
}

export async function getPublicPages(locale: AppLocale) {
  const pages = await listPublishedPages(1000, locale);
  return pages.map(serializePage);
}

export async function getPageByIdOrThrow(pageId: string) {
  const page = await findPageById(pageId);

  if (!page) {
    throw new PagesServiceError(404, "Page non trouvée.");
  }

  return serializePage(page);
}

export async function getPublicPageBySlugOrThrow(slug: string, locale: AppLocale) {
  const normalizedSlug = normalizeSlug(slug);
  const page = await findPageBySlug(normalizedSlug, locale);

  if (!page || page.status !== PageStatus.PUBLISHED) {
    throw new PagesServiceError(404, "Page non trouvée.");
  }

  return serializePage(page);
}

export const findPublicPageBySlug = cache(async (slug: string, locale: AppLocale) => {
  const normalizedSlug = normalizeSlug(slug);
  const page = await findPageBySlug(normalizedSlug, locale);

  if (!page || page.status !== PageStatus.PUBLISHED) {
    return null;
  }

  return serializePage(page);
});

export async function createPage(input: unknown, user: AuthUser) {
  const payload = parsePageInput(input);
  const initialStatus = isAdminRole(user.role) ? PageStatus.PUBLISHED : PageStatus.PENDING;

  if (!isAdminRole(user.role) && payload.slug === "/") {
    throw new AuthError(403, "Les éditeurs ne peuvent pas créer la page d’accueil.");
  }

  await ensureSlugAvailable(payload.slug, payload.locale);

  const page = await createPageRecord({
    locale: payload.locale,
    title: payload.title,
    slug: payload.slug,
    metaTitle: payload.metaTitle,
    metaDescription: payload.metaDescription,
    metaKeywords: payload.metaKeywords,
    canonicalUrl: payload.canonicalUrl,
    robotsDirective: payload.robotsDirective,
    ogTitle: payload.ogTitle,
    ogDescription: payload.ogDescription,
    ogImageUrl: payload.ogImageUrl,
    ogImageAlt: payload.ogImageAlt,
    twitterTitle: payload.twitterTitle,
    twitterDescription: payload.twitterDescription,
    twitterImageUrl: payload.twitterImageUrl,
    focusKeyword: payload.focusKeyword,
    secondaryKeywords: payload.secondaryKeywords,
    schemaOrgJson: payload.schemaOrgJson,
    imageRecommendations: payload.imageRecommendations as unknown as Prisma.InputJsonValue,
    sitemapPriority: payload.sitemapPriority,
    sitemapChangeFreq: payload.sitemapChangeFreq,
    sections: payload.sections as Prisma.InputJsonValue,
    status: initialStatus,
    isInMenu: payload.isInMenu,
    menuOrder: payload.menuOrder,
    menuLabel: payload.menuLabel,
    currentVersion: 1,
    publishedVersion: initialStatus === PageStatus.PUBLISHED ? 1 : null,
    createdBy: user.id,
  });

  await createPageVersionRecord({
    pageId: page.id,
    versionNumber: 1,
    content: toJsonValue(payload),
    status: initialStatus,
    createdBy: user.id,
    approvedBy: initialStatus === PageStatus.PUBLISHED ? user.id : null,
    approvedAt: initialStatus === PageStatus.PUBLISHED ? new Date() : null,
  });

  await upsertPageContentRecord(page.id, toJsonValue(payload));

  await syncMenuFromPublishedPages(user.id, payload.locale);

  await automatePageSeoAndOg(serializePage(page)).catch((error) => {
    console.error("Automatisation SEO/OG échouée à la création", error);
  });
  await cleanupOrphanedManagedImages();

  return getPageByIdOrThrow(page.id);
}

export async function updatePage(pageId: string, input: unknown, user: AuthUser) {
  const page = await findPageById(pageId);

  if (!page) {
    throw new PagesServiceError(404, "Page non trouvée.");
  }

  if (!isAdminRole(user.role) && page.slug === "/") {
    throw new AuthError(403, "Les éditeurs ne peuvent pas modifier la page d’accueil.");
  }

  const updates = parsePageUpdateInput(input);
  const targetLocale = updates.locale ?? normalizeLocale(page.locale);

  if (updates.slug) {
    await ensureSlugAvailable(updates.slug, targetLocale, pageId);
  }

  const currentContent = serializeContent(page);
  const mergedContent: PageInput = {
    locale: targetLocale,
    title: updates.title ?? currentContent.title,
    slug: updates.slug ?? currentContent.slug,
    metaTitle: updates.metaTitle ?? currentContent.metaTitle,
    metaDescription: updates.metaDescription ?? currentContent.metaDescription,
    metaKeywords: updates.metaKeywords ?? currentContent.metaKeywords,
    canonicalUrl: updates.canonicalUrl ?? currentContent.canonicalUrl,
    robotsDirective: updates.robotsDirective ?? currentContent.robotsDirective,
    ogTitle: updates.ogTitle ?? currentContent.ogTitle,
    ogDescription: updates.ogDescription ?? currentContent.ogDescription,
    ogImageUrl: updates.ogImageUrl ?? currentContent.ogImageUrl,
    ogImageAlt: updates.ogImageAlt ?? currentContent.ogImageAlt,
    twitterTitle: updates.twitterTitle ?? currentContent.twitterTitle,
    twitterDescription: updates.twitterDescription ?? currentContent.twitterDescription,
    twitterImageUrl: updates.twitterImageUrl ?? currentContent.twitterImageUrl,
    focusKeyword: updates.focusKeyword ?? currentContent.focusKeyword,
    secondaryKeywords: updates.secondaryKeywords ?? currentContent.secondaryKeywords,
    schemaOrgJson: updates.schemaOrgJson ?? currentContent.schemaOrgJson,
    imageRecommendations: updates.imageRecommendations ?? currentContent.imageRecommendations,
    sitemapPriority: updates.sitemapPriority ?? currentContent.sitemapPriority,
    sitemapChangeFreq: updates.sitemapChangeFreq ?? currentContent.sitemapChangeFreq,
    sections: updates.sections ?? currentContent.sections,
    isInMenu: updates.isInMenu ?? currentContent.isInMenu,
    menuOrder: updates.menuOrder ?? currentContent.menuOrder,
    menuLabel: updates.menuLabel ?? currentContent.menuLabel,
  };
  const nextVersion = page.currentVersion + 1;
  const nextStatus = resolveNextStatus(user, page.status, updates.status);

  const updatedPage = await updatePageRecord(pageId, {
    locale: mergedContent.locale,
    title: mergedContent.title,
    slug: mergedContent.slug,
    metaTitle: mergedContent.metaTitle,
    metaDescription: mergedContent.metaDescription,
    metaKeywords: mergedContent.metaKeywords,
    canonicalUrl: mergedContent.canonicalUrl,
    robotsDirective: mergedContent.robotsDirective,
    ogTitle: mergedContent.ogTitle,
    ogDescription: mergedContent.ogDescription,
    ogImageUrl: mergedContent.ogImageUrl,
    ogImageAlt: mergedContent.ogImageAlt,
    twitterTitle: mergedContent.twitterTitle,
    twitterDescription: mergedContent.twitterDescription,
    twitterImageUrl: mergedContent.twitterImageUrl,
    focusKeyword: mergedContent.focusKeyword,
    secondaryKeywords: mergedContent.secondaryKeywords,
    schemaOrgJson: mergedContent.schemaOrgJson,
    imageRecommendations: mergedContent.imageRecommendations as unknown as Prisma.InputJsonValue,
    sitemapPriority: mergedContent.sitemapPriority,
    sitemapChangeFreq: mergedContent.sitemapChangeFreq,
    sections: mergedContent.sections as Prisma.InputJsonValue,
    status: nextStatus,
    isInMenu: mergedContent.isInMenu,
    menuOrder: mergedContent.menuOrder,
    menuLabel: mergedContent.menuLabel,
    currentVersion: nextVersion,
    publishedVersion: nextStatus === PageStatus.PUBLISHED ? nextVersion : page.publishedVersion,
    updatedBy: user.id,
    updatedAt: new Date(),
  });

  await createPageVersionRecord({
    pageId,
    versionNumber: nextVersion,
    content: toJsonValue(mergedContent),
    status: nextStatus,
    createdBy: user.id,
    approvedBy: nextStatus === PageStatus.PUBLISHED ? user.id : null,
    approvedAt: nextStatus === PageStatus.PUBLISHED ? new Date() : null,
  });

  await upsertPageContentRecord(pageId, toJsonValue(mergedContent));

  await syncMenuFromPublishedPages(user.id, normalizeLocale(page.locale));

  if (normalizeLocale(page.locale) !== mergedContent.locale) {
    await syncMenuFromPublishedPages(user.id, mergedContent.locale);
  }

  await cleanupOrphanedManagedImages();

  return serializePage(updatedPage);
}

export async function removePage(pageId: string, user: AuthUser) {
  if (!isAdminRole(user.role)) {
    throw new AuthError(403, "Seuls les administrateurs peuvent supprimer une page.");
  }

  const page = await findPageById(pageId);

  if (!page) {
    throw new PagesServiceError(404, "Page non trouvée.");
  }

  await deletePagePreviewsByPageId(pageId);
  await deletePageEditsByPageId(pageId);
  await deletePageContentByPageId(pageId);
  await deleteVersionsForPage(pageId);
  await deletePageRecord(pageId);
  await syncMenuFromPublishedPages(user.id, normalizeLocale(page.locale));
  await cleanupOrphanedManagedImages();

  return { message: "Page supprimée avec succès." };
}

export async function getPendingChanges(user: AuthUser) {
  if (!isAdminRole(user.role)) {
    throw new AuthError(403, "Seuls les administrateurs peuvent valider des contenus.");
  }

  const pendingVersions = await listPendingPageVersions();

  if (pendingVersions.length === 0) {
    return [];
  }

  const pageIds = [...new Set(pendingVersions.map((version) => version.pageId))];
  const userIds = [...new Set(pendingVersions.map((version) => version.createdBy))];
  const pages = await listPagesByIds(pageIds);
  const users = await listUsersByIds(userIds);
  const publishedPageIds = pages.filter((page) => page.publishedVersion).map((page) => page.id);
  const publishedVersions = pages
    .map((page) => page.publishedVersion)
    .filter((value): value is number => typeof value === "number");
  const currentVersions = await listVersionsForPublishedStates(publishedPageIds, publishedVersions);

  const pagesMap = new Map(pages.map((page) => [page.id, page]));
  const usersMap = new Map(users.map((entry) => [entry.id, entry]));
  const publishedMap = new Map(currentVersions.map((version) => [`${version.pageId}:${version.versionNumber}`, version]));

  return pendingVersions
    .map((version) => {
      const page = pagesMap.get(version.pageId);

      if (!page) {
        return null;
      }

      const editor = usersMap.get(version.createdBy);
      const publishedVersion = page.publishedVersion
        ? publishedMap.get(`${page.id}:${page.publishedVersion}`)
        : null;

      return {
        versionId: version.id,
        pageId: page.id,
        pageTitle: page.title,
        pageSlug: page.slug,
        versionNumber: version.versionNumber,
        editorName: editor?.name ?? "Inconnu",
        editorEmail: editor?.email ?? "inconnu@greeters.local",
        createdAt: version.createdAt.toISOString(),
        currentContent: publishedVersion ? serializeVersionContent(publishedVersion) : null,
        pendingContent: serializeVersionContent(version),
      } satisfies PendingChangeResponse;
    })
    .filter((entry): entry is PendingChangeResponse => entry !== null);
}

export async function approvePendingChange(versionId: string, user: AuthUser) {
  if (!isAdminRole(user.role)) {
    throw new AuthError(403, "Seuls les administrateurs peuvent approuver une version.");
  }

  const version = await findPageVersionById(versionId);

  if (!version) {
    throw new PagesServiceError(404, "Version non trouvée.");
  }

  if (version.status !== PageStatus.PENDING) {
    throw new PagesServiceError(400, "Cette version n’est pas en attente d’approbation.");
  }

  const content = serializeVersionContent(version);

  await updatePageVersionStatus(versionId, {
    status: PageStatus.PUBLISHED,
    approvedBy: user.id,
    approvedAt: new Date(),
    rejectionReason: null,
  });

  await updatePageRecord(version.pageId, {
    title: content.title,
    slug: content.slug,
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription,
    metaKeywords: content.metaKeywords,
    canonicalUrl: content.canonicalUrl,
    robotsDirective: content.robotsDirective,
    ogTitle: content.ogTitle,
    ogDescription: content.ogDescription,
    ogImageUrl: content.ogImageUrl,
    ogImageAlt: content.ogImageAlt,
    twitterTitle: content.twitterTitle,
    twitterDescription: content.twitterDescription,
    twitterImageUrl: content.twitterImageUrl,
    focusKeyword: content.focusKeyword,
    secondaryKeywords: content.secondaryKeywords,
    schemaOrgJson: content.schemaOrgJson,
    imageRecommendations: content.imageRecommendations as unknown as Prisma.InputJsonValue,
    sitemapPriority: content.sitemapPriority,
    sitemapChangeFreq: content.sitemapChangeFreq,
    sections: content.sections as Prisma.InputJsonValue,
    status: PageStatus.PUBLISHED,
    isInMenu: content.isInMenu,
    menuOrder: content.menuOrder,
    menuLabel: content.menuLabel,
    publishedVersion: version.versionNumber,
    updatedBy: user.id,
    updatedAt: new Date(),
  });

  await upsertPageContentRecord(version.pageId, toJsonValue(content));

  await syncMenuFromPublishedPages(user.id, content.locale);
  await cleanupOrphanedManagedImages();

  return { message: "Modifications approuvées et publiées." };
}

export async function rejectPendingChange(versionId: string, reason: string | null, user: AuthUser) {
  if (!isAdminRole(user.role)) {
    throw new AuthError(403, "Seuls les administrateurs peuvent rejeter une version.");
  }

  const version = await findPageVersionById(versionId);

  if (!version) {
    throw new PagesServiceError(404, "Version non trouvée.");
  }

  if (version.status !== PageStatus.PENDING) {
    throw new PagesServiceError(400, "Cette version n’est pas en attente d’approbation.");
  }

  const page = await findPageById(version.pageId);

  if (!page) {
    throw new PagesServiceError(404, "Page non trouvée.");
  }

  await updatePageVersionStatus(versionId, {
    status: PageStatus.DRAFT,
    rejectionReason: reason,
  });

  if (page.publishedVersion) {
    const publishedVersion = await findPageVersion(page.id, page.publishedVersion);

    if (publishedVersion) {
      const content = serializeVersionContent(publishedVersion);

      await updatePageRecord(page.id, {
        title: content.title,
        slug: content.slug,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        metaKeywords: content.metaKeywords,
        canonicalUrl: content.canonicalUrl,
        robotsDirective: content.robotsDirective,
        ogTitle: content.ogTitle,
        ogDescription: content.ogDescription,
        ogImageUrl: content.ogImageUrl,
        ogImageAlt: content.ogImageAlt,
        twitterTitle: content.twitterTitle,
        twitterDescription: content.twitterDescription,
        twitterImageUrl: content.twitterImageUrl,
        focusKeyword: content.focusKeyword,
        secondaryKeywords: content.secondaryKeywords,
        schemaOrgJson: content.schemaOrgJson,
        imageRecommendations: content.imageRecommendations as unknown as Prisma.InputJsonValue,
        sitemapPriority: content.sitemapPriority,
        sitemapChangeFreq: content.sitemapChangeFreq,
        sections: content.sections as Prisma.InputJsonValue,
        status: PageStatus.PUBLISHED,
        isInMenu: content.isInMenu,
        menuOrder: content.menuOrder,
        menuLabel: content.menuLabel,
        updatedBy: user.id,
        updatedAt: new Date(),
      });

      await upsertPageContentRecord(page.id, toJsonValue(content));
    }
  } else {
    await updatePageRecord(page.id, {
      status: PageStatus.DRAFT,
      updatedBy: user.id,
      updatedAt: new Date(),
    });
  }

  await syncMenuFromPublishedPages(user.id, normalizeLocale(page.locale));
  await cleanupOrphanedManagedImages();

  return {
    message: "Modifications rejetées.",
    reason,
  };
}

export async function getPageVersions(pageId: string, user: AuthUser, limit = 5) {
  if (!user) {
    throw new AuthError(401, "Authentification requise.");
  }

  const page = await findPageById(pageId);

  if (!page) {
    throw new PagesServiceError(404, "Page non trouvée.");
  }

  const versions = await listPageVersions(pageId, limit);
  const users = await listUsersByIds([...new Set(versions.map((version) => version.createdBy))]);
  const usersMap = new Map(users.map((entry) => [entry.id, entry.name]));

  return versions.map((version) => ({
    id: version.id,
    versionNumber: version.versionNumber,
    status: STATUS_TO_API[version.status],
    createdBy: version.createdBy,
    createdByName: usersMap.get(version.createdBy) ?? "Inconnu",
    createdAt: version.createdAt.toISOString(),
    approvedBy: version.approvedBy,
    approvedAt: version.approvedAt?.toISOString() ?? null,
    rejectionReason: version.rejectionReason,
    isCurrent: version.versionNumber === page.currentVersion,
    isPublished: version.versionNumber === page.publishedVersion,
    content: serializeVersionContent(version),
  } satisfies PageVersionResponse));
}

export async function rollbackPage(pageId: string, versionNumber: number, user: AuthUser) {
  if (!isAdminRole(user.role)) {
    throw new AuthError(403, "Seuls les administrateurs peuvent restaurer une version.");
  }

  const page = await findPageById(pageId);

  if (!page) {
    throw new PagesServiceError(404, "Page non trouvée.");
  }

  const targetVersion = await findPageVersion(pageId, versionNumber);

  if (!targetVersion) {
    throw new PagesServiceError(404, "Version non trouvée.");
  }

  const content = serializeVersionContent(targetVersion);
  const nextVersion = page.currentVersion + 1;

  await createPageVersionRecord({
    pageId,
    versionNumber: nextVersion,
    content: toJsonValue(content),
    status: PageStatus.PUBLISHED,
    createdBy: user.id,
    approvedBy: user.id,
    approvedAt: new Date(),
  });

  await updatePageRecord(pageId, {
    title: content.title,
    slug: content.slug,
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription,
    metaKeywords: content.metaKeywords,
    canonicalUrl: content.canonicalUrl,
    robotsDirective: content.robotsDirective,
    ogTitle: content.ogTitle,
    ogDescription: content.ogDescription,
    ogImageUrl: content.ogImageUrl,
    ogImageAlt: content.ogImageAlt,
    twitterTitle: content.twitterTitle,
    twitterDescription: content.twitterDescription,
    twitterImageUrl: content.twitterImageUrl,
    focusKeyword: content.focusKeyword,
    secondaryKeywords: content.secondaryKeywords,
    schemaOrgJson: content.schemaOrgJson,
    imageRecommendations: content.imageRecommendations as unknown as Prisma.InputJsonValue,
    sitemapPriority: content.sitemapPriority,
    sitemapChangeFreq: content.sitemapChangeFreq,
    sections: content.sections as Prisma.InputJsonValue,
    status: PageStatus.PUBLISHED,
    isInMenu: content.isInMenu,
    menuOrder: content.menuOrder,
    menuLabel: content.menuLabel,
    currentVersion: nextVersion,
    publishedVersion: nextVersion,
    updatedBy: user.id,
    updatedAt: new Date(),
  });

  await upsertPageContentRecord(pageId, toJsonValue(content));

  await syncMenuFromPublishedPages(user.id, content.locale);
  await cleanupOrphanedManagedImages();

  return {
    message: `Page restaurée à partir de la version ${versionNumber}.`,
    newVersion: nextVersion,
  };
}

export async function getPagesDashboardMetrics() {
  const counts = await countPagesByStatus();

  return {
    draft: Object.entries(counts).filter(([key]) => key.endsWith(":DRAFT")).reduce((total, [, value]) => total + value, 0),
    pending: Object.entries(counts).filter(([key]) => key.endsWith(":PENDING")).reduce((total, [, value]) => total + value, 0),
    published: Object.entries(counts).filter(([key]) => key.endsWith(":PUBLISHED")).reduce((total, [, value]) => total + value, 0),
    archived: Object.entries(counts).filter(([key]) => key.endsWith(":ARCHIVED")).reduce((total, [, value]) => total + value, 0),
  };
}