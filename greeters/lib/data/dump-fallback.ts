import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { PageStatus, type HomeSection, type Menu, type Page, type Prisma } from "@prisma/client";

type DumpRow = Record<string, unknown>;
type DumpTable = { rows?: DumpRow[] };
type DumpData = {
  pages?: DumpTable;
  menus?: DumpTable;
  home_sections?: DumpTable;
};

const DUMP_FALLBACK_ENABLED = process.env.GREETERS_USE_DUMP_FALLBACK === "1";
const DUMP_PATH = path.join(process.cwd(), "dump.json");

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toPageStatus(value: unknown) {
  const normalized = asString(value).trim().toUpperCase();

  switch (normalized) {
    case PageStatus.PUBLISHED:
      return PageStatus.PUBLISHED;
    case PageStatus.PENDING:
      return PageStatus.PENDING;
    case PageStatus.ARCHIVED:
      return PageStatus.ARCHIVED;
    default:
      return PageStatus.DRAFT;
  }
}

const readDump = cache((): DumpData => {
  if (!DUMP_FALLBACK_ENABLED) {
    return {};
  }

  if (!fs.existsSync(DUMP_PATH)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(DUMP_PATH, "utf-8")) as DumpData;
  } catch (error) {
    console.error("Impossible de lire dump.json", error);
    return {};
  }
});

function mapPage(row: DumpRow): Page {
  return {
    id: asString(row.id),
    locale: asString(row.locale, "fr"),
    title: asString(row.title),
    slug: asString(row.slug, "/"),
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
    imageRecommendations: (row.image_recommendations ?? []) as Prisma.JsonValue,
    sitemapPriority: asOptionalNumber(row.sitemap_priority),
    sitemapChangeFreq: asOptionalString(row.sitemap_change_freq),
    sections: (row.sections ?? []) as Prisma.JsonValue,
    status: toPageStatus(row.status),
    isInMenu: asBoolean(row.is_in_menu),
    menuOrder: asNumber(row.menu_order, 0),
    menuLabel: asOptionalString(row.menu_label),
    currentVersion: asNumber(row.current_version, 1),
    publishedVersion: asOptionalNumber(row.published_version),
    createdBy: asString(row.created_by),
    createdAt: asDate(row.created_at) ?? new Date(),
    updatedBy: asOptionalString(row.updated_by),
    updatedAt: asDate(row.updated_at),
  } as Page;
}

function mapMenu(row: DumpRow): Menu {
  return {
    id: asString(row.id),
    items: (Array.isArray(row.items) ? row.items : []) as Prisma.JsonValue,
    updatedBy: asOptionalString(row.updated_by),
    updatedAt: asDate(row.updated_at),
  } as Menu;
}

function mapHomeSection(row: DumpRow): HomeSection {
  return {
    id: asString(row.id),
    sectionType: asString(row.section_type),
    content: (row.content ?? null) as Prisma.JsonValue,
    items: (row.items ?? null) as Prisma.JsonValue,
    order: asNumber(row.order, 0),
    updatedAt: asDate(row.updated_at) ?? new Date(),
  } as HomeSection;
}

function getPages() {
  return (readDump().pages?.rows ?? []).map(mapPage);
}

function getMenus() {
  return (readDump().menus?.rows ?? []).map(mapMenu);
}

function getHomeSections() {
  return (readDump().home_sections?.rows ?? []).map(mapHomeSection);
}

export function isDumpFallbackEnabled() {
  return DUMP_FALLBACK_ENABLED;
}

export function listDumpPages(input: { locale?: string; status?: PageStatus; skip?: number; limit?: number } = {}) {
  return getPages()
    .filter((page) => (input.locale ? page.locale === input.locale : true))
    .filter((page) => (input.status ? page.status === input.status : true))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(input.skip ?? 0, (input.skip ?? 0) + (input.limit ?? 100));
}

export function getDumpPageById(id: string) {
  return getPages().find((page) => page.id === id) ?? null;
}

export function getDumpPageBySlug(slug: string, locale: string) {
  return getPages().find((page) => page.slug === slug && page.locale === locale) ?? null;
}

export function listDumpPagesByIds(ids: string[]) {
  const idSet = new Set(ids);
  return getPages().filter((page) => idSet.has(page.id));
}

export function countDumpPagesByStatus() {
  return getPages().reduce<Record<string, number>>((accumulator, page) => {
    const key = `${page.locale}:${page.status}`;
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function getDumpMainMenu(id: string) {
  return getMenus().find((menu) => menu.id === id) ?? null;
}

export function listDumpHomeSections() {
  return getHomeSections().sort((left, right) => left.order - right.order || right.updatedAt.getTime() - left.updatedAt.getTime());
}

export function getDumpHomeSectionByType(sectionType: string) {
  return getHomeSections().find((section) => section.sectionType === sectionType) ?? null;
}