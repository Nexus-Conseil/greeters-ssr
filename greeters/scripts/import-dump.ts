import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import {
  AiChatRole,
  PageStatus,
  PreviewStatus,
  UserRole,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../lib/db/prisma";

type DumpRow = Record<string, unknown>;
type DumpTable = { rows?: DumpRow[] };
type DumpPayload = Record<string, DumpTable>;

const DUMP_PATH = process.argv[2] ?? path.join(process.cwd(), "dump.json");

const readDump = async () => JSON.parse(await fs.readFile(DUMP_PATH, "utf-8")) as DumpPayload;

const asString = (value: unknown) => (typeof value === "string" ? value : "");
const asOptionalString = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const asNumber = (value: unknown, fallback = 0) => (typeof value === "number" ? value : fallback);
const asOptionalNumber = (value: unknown) => (typeof value === "number" ? value : null);
const asBoolean = (value: unknown, fallback = false) => (typeof value === "boolean" ? value : fallback);
const asDate = (value: unknown) => (typeof value === "string" ? new Date(value) : new Date());
const asOptionalDate = (value: unknown) => (typeof value === "string" ? new Date(value) : null);
const asJson = (value: unknown) => (value ?? null) as Prisma.InputJsonValue;

const toUserRole = (value: unknown) => {
  switch (asString(value).toLowerCase()) {
    case "super_admin":
      return UserRole.SUPER_ADMIN;
    case "admin":
      return UserRole.ADMIN;
    default:
      return UserRole.EDITOR;
  }
};

const toPageStatus = (value: unknown) => {
  switch (asString(value).toLowerCase()) {
    case "published":
      return PageStatus.PUBLISHED;
    case "pending":
      return PageStatus.PENDING;
    case "archived":
      return PageStatus.ARCHIVED;
    default:
      return PageStatus.DRAFT;
  }
};

const toPreviewStatus = (value: unknown) => {
  switch (asString(value).toLowerCase()) {
    case "validated":
      return PreviewStatus.VALIDATED;
    case "rejected":
      return PreviewStatus.REJECTED;
    case "expired":
      return PreviewStatus.EXPIRED;
    default:
      return PreviewStatus.PENDING;
  }
};

const toAiChatRole = (value: unknown) => (asString(value).toLowerCase() === "assistant" ? AiChatRole.ASSISTANT : AiChatRole.USER);

const chunk = <T>(rows: T[], size = 100) => {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
};

async function createManyInChunks<T>(rows: T[], handler: (data: T[]) => Promise<unknown>) {
  for (const batch of chunk(rows)) {
    if (batch.length > 0) {
      await handler(batch);
    }
  }
}

async function main() {
  const dump = await readDump();

  console.log(`Import du dump depuis ${DUMP_PATH}`);
  console.log("Réinitialisation des tables cibles...");

  await prisma.aiChatMessage.deleteMany();
  await prisma.aiChatSession.deleteMany();
  await prisma.pageEdit.deleteMany();
  await prisma.pagePreview.deleteMany();
  await prisma.pageVersion.deleteMany();
  await prisma.pageContent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.homeSection.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.document.deleteMany();
  await prisma.page.deleteMany();
  await prisma.user.deleteMany();

  const users = (dump.users?.rows ?? []).map((row) => ({
    id: asString(row.id),
    email: asString(row.email),
    name: asString(row.name),
    passwordHash: asString(row.password_hash),
    role: toUserRole(row.role),
    createdBy: asOptionalString(row.created_by),
    createdAt: asDate(row.created_at),
  }));
  await createManyInChunks(users, (data) => prisma.user.createMany({ data }));
  console.log(`Users importés: ${users.length}`);

  const sessions = (dump.sessions?.rows ?? []).map((row) => ({
    id: asString(row.id),
    userId: asString(row.user_id),
    tokenHash: asString(row.token_hash),
    expiresAt: asDate(row.expires_at),
    createdAt: asDate(row.created_at),
  }));
  await createManyInChunks(sessions, (data) => prisma.session.createMany({ data }));
  console.log(`Sessions importées: ${sessions.length}`);

  const passwordResets = (dump.password_resets?.rows ?? []).map((row) => ({
    id: asString(row.id),
    userId: asString(row.user_id),
    email: asString(row.email),
    tokenHash: asString(row.token_hash),
    expiresAt: asDate(row.expires_at),
    createdAt: asDate(row.created_at),
  }));
  await createManyInChunks(passwordResets, (data) => prisma.passwordReset.createMany({ data }));
  console.log(`Password resets importés: ${passwordResets.length}`);

  const pages = (dump.pages?.rows ?? []).map((row) => ({
    id: asString(row.id),
    locale: asString(row.locale) || "fr",
    title: asString(row.title),
    slug: asString(row.slug),
    metaTitle: asOptionalString(row.meta_title),
    metaDescription: asOptionalString(row.meta_description),
    metaKeywords: asOptionalString(row.meta_keywords),
    canonicalUrl: asOptionalString(row.canonical_url),
    robotsDirective: asOptionalString(row.robots_directive),
    ogTitle: asOptionalString(row.og_title),
    ogDescription: asOptionalString(row.og_description),
    ogImageUrl: asOptionalString(row.og_image_url),
    ogImageAlt: asOptionalString(row.og_image_alt),
    twitterTitle: asOptionalString(row.twitter_title),
    twitterDescription: asOptionalString(row.twitter_description),
    twitterImageUrl: asOptionalString(row.twitter_image_url),
    focusKeyword: asOptionalString(row.focus_keyword),
    secondaryKeywords: asOptionalString(row.secondary_keywords),
    schemaOrgJson: asOptionalString(row.schema_org_json),
    imageRecommendations: asJson(row.image_recommendations ?? []),
    sitemapPriority: asOptionalNumber(row.sitemap_priority),
    sitemapChangeFreq: asOptionalString(row.sitemap_change_freq),
    sections: asJson(row.sections ?? []),
    status: toPageStatus(row.status),
    isInMenu: asBoolean(row.is_in_menu),
    menuOrder: asNumber(row.menu_order),
    menuLabel: asOptionalString(row.menu_label),
    currentVersion: asNumber(row.current_version, 1),
    publishedVersion: asOptionalNumber(row.published_version),
    createdBy: asString(row.created_by),
    createdAt: asDate(row.created_at),
    updatedBy: asOptionalString(row.updated_by),
    updatedAt: asOptionalDate(row.updated_at),
  }));
  await createManyInChunks(pages, (data) => prisma.page.createMany({ data }));
  console.log(`Pages importées: ${pages.length}`);

  const pageVersions = (dump.page_versions?.rows ?? []).map((row) => ({
    id: asString(row.id),
    pageId: asString(row.page_id),
    versionNumber: asNumber(row.version_number, 1),
    content: asJson(row.content ?? {}),
    status: toPageStatus(row.status),
    createdBy: asString(row.created_by),
    createdAt: asDate(row.created_at),
    approvedBy: asOptionalString(row.approved_by),
    approvedAt: asOptionalDate(row.approved_at),
    rejectionReason: asOptionalString(row.rejection_reason),
  }));
  await createManyInChunks(pageVersions, (data) => prisma.pageVersion.createMany({ data }));
  console.log(`Versions importées: ${pageVersions.length}`);

  const menus = (dump.menus?.rows ?? []).map((row) => ({
    id: asString(row.id),
    items: asJson(row.items ?? []),
    updatedBy: asOptionalString(row.updated_by),
    updatedAt: asOptionalDate(row.updated_at),
  }));
  await createManyInChunks(menus, (data) => prisma.menu.createMany({ data }));
  console.log(`Menus importés: ${menus.length}`);

  const documents = (dump.documents?.rows ?? []).map((row) => ({
    id: asString(row.id),
    filename: asString(row.filename),
    originalFilename: asString(row.original_filename),
    filePath: asString(row.file_path),
    fileSize: BigInt(asNumber(row.file_size)),
    mimeType: asString(row.mime_type),
    category: asString(row.category),
    description: asOptionalString(row.description),
    uploadedBy: asString(row.uploaded_by),
    createdAt: asDate(row.created_at),
  }));
  await createManyInChunks(documents, (data) => prisma.document.createMany({ data }));
  console.log(`Documents importés: ${documents.length}`);

  const homeSections = (dump.home_sections?.rows ?? []).map((row) => ({
    id: asString(row.id),
    sectionType: asString(row.section_type),
    content: asJson(row.content),
    items: asJson(row.items),
    order: asNumber(row.order),
    updatedAt: asDate(row.updated_at),
  }));
  await createManyInChunks(homeSections, (data) => prisma.homeSection.createMany({ data }));
  console.log(`Sections home importées: ${homeSections.length}`);

  const pageContents = (dump.page_contents?.rows ?? []).map((row) => ({
    id: asString(row.id),
    pageId: asString(row.page_id),
    content: asJson(row.content ?? {}),
    updatedAt: asDate(row.updated_at),
  }));
  await createManyInChunks(pageContents, (data) => prisma.pageContent.createMany({ data }));
  console.log(`Contenus de page importés: ${pageContents.length}`);

  const pagePreviews = (dump.page_previews?.rows ?? []).map((row) => ({
    id: asString(row.id),
    pageId: asString(row.page_id),
    newContent: asJson(row.new_content ?? {}),
    status: toPreviewStatus(row.status),
    createdBy: asString(row.created_by),
    createdAt: asDate(row.created_at),
  }));
  await createManyInChunks(pagePreviews, (data) => prisma.pagePreview.createMany({ data }));
  console.log(`Previews importées: ${pagePreviews.length}`);

  const pageEdits = (dump.page_edits?.rows ?? []).map((row) => ({
    id: asString(row.id),
    pageId: asString(row.page_id),
    prompt: asString(row.prompt),
    changesSummary: asOptionalString(row.changes_summary),
    editorId: asOptionalString(row.editor_id),
    editorName: asOptionalString(row.editor_name),
    createdAt: asDate(row.created_at),
  }));
  await createManyInChunks(pageEdits, (data) => prisma.pageEdit.createMany({ data }));
  console.log(`Éditions importées: ${pageEdits.length}`);

  const aiChatSessions = (dump.ai_chat_sessions?.rows ?? []).map((row) => ({
    id: asString(row.id),
    createdBy: asString(row.created_by),
    locale: asString(row.locale) || "fr",
    title: asOptionalString(row.title),
    latestDraft: asJson(row.latest_draft),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  }));
  await createManyInChunks(aiChatSessions, (data) => prisma.aiChatSession.createMany({ data }));
  console.log(`Sessions IA importées: ${aiChatSessions.length}`);

  const aiChatMessages = (dump.ai_chat_messages?.rows ?? []).map((row) => ({
    id: asString(row.id),
    sessionId: asString(row.session_id),
    role: toAiChatRole(row.role),
    content: asString(row.content),
    generatedPage: asJson(row.generated_page),
    createdAt: asDate(row.created_at),
  }));
  await createManyInChunks(aiChatMessages, (data) => prisma.aiChatMessage.createMany({ data }));
  console.log(`Messages IA importés: ${aiChatMessages.length}`);

  console.log("Import terminé avec succès.");
}

main()
  .catch((error) => {
    console.error("Échec de l'import du dump", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
