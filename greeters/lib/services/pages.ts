import { PageStatus, type Page, type PageVersion, type Prisma } from "@prisma/client";

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
import { syncMenuFromPublishedPages } from "@/lib/services/menu";
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

export type PageInput = {
  locale: AppLocale;
  title: string;
  slug: string;
  metaDescription: string | null;
  metaKeywords: string | null;
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

function parseStatus(input: unknown) {
  if (typeof input !== "string") {
    return undefined;
  }

  const normalized = input.trim().toLowerCase() as PageApiStatus;
  return STATUS_FROM_API[normalized] ? normalized : undefined;
}

function parsePageInput(input: unknown): PageInput {
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
    metaDescription: parseOptionalString(candidate.metaDescription ?? candidate.meta_description),
    metaKeywords: parseOptionalString(candidate.metaKeywords ?? candidate.meta_keywords),
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

  if ("metaKeywords" in candidate || "meta_keywords" in candidate) {
    payload.metaKeywords = parseOptionalString(candidate.metaKeywords ?? candidate.meta_keywords);
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

function serializeContent(page: Pick<Page, "locale" | "title" | "slug" | "metaDescription" | "metaKeywords" | "sections" | "isInMenu" | "menuOrder" | "menuLabel">): PageInput {
  return {
    locale: normalizeLocale(page.locale),
    title: page.title,
    slug: page.slug,
    metaDescription: page.metaDescription,
    metaKeywords: page.metaKeywords,
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
    metaDescription: content.metaDescription,
    metaKeywords: content.metaKeywords,
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

export async function findPublicPageBySlug(slug: string, locale: AppLocale) {
  const normalizedSlug = normalizeSlug(slug);
  const page = await findPageBySlug(normalizedSlug, locale);

  if (!page || page.status !== PageStatus.PUBLISHED) {
    return null;
  }

  return serializePage(page);
}

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
    metaDescription: payload.metaDescription,
    metaKeywords: payload.metaKeywords,
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

  return serializePage(page);
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
    metaDescription: updates.metaDescription ?? currentContent.metaDescription,
    metaKeywords: updates.metaKeywords ?? currentContent.metaKeywords,
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
    metaDescription: mergedContent.metaDescription,
    metaKeywords: mergedContent.metaKeywords,
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
    metaDescription: content.metaDescription,
    metaKeywords: content.metaKeywords,
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
        metaDescription: content.metaDescription,
        metaKeywords: content.metaKeywords,
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
    metaDescription: content.metaDescription,
    metaKeywords: content.metaKeywords,
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