import { DEFAULT_LOCALE } from "@/lib/i18n/config";

import type { EditorBlock, EditorBlockType, EditorPage, EditorSection } from "./editor-types";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function slugifyTitle(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "nouvelle-page";
}

export function getDefaultBlockContent(type: EditorBlockType): Record<string, string> {
  switch (type) {
    case "heading":
      return { text: "Nouveau titre", level: "h2" };
    case "text":
      return { text: "Votre texte ici..." };
    case "image":
      return { src: "", alt: "", caption: "" };
    case "button":
      return { text: "En savoir plus", href: "/", style: "primary" };
  }
}

export function createEmptyBlock(type: EditorBlockType, order: number): EditorBlock {
  return {
    id: createId("block"),
    type,
    order,
    content: getDefaultBlockContent(type),
  };
}

export function createEmptySection(order: number): EditorSection {
  return {
    id: createId("section"),
    name: `Section ${order + 1}`,
    layout: "default",
    background: "white",
    backgroundImage: null,
    blocks: [],
    order,
  };
}

export function createEmptyPage(): EditorPage {
  return {
    locale: DEFAULT_LOCALE,
    title: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    robotsDirective: "index,follow",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    ogImageAlt: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImageUrl: "",
    focusKeyword: "",
    secondaryKeywords: "",
    schemaOrgJson: "",
    imageRecommendations: [],
    sitemapPriority: 0.7,
    sitemapChangeFreq: "monthly",
    sections: [],
    isInMenu: false,
    menuOrder: 0,
    menuLabel: "",
    status: "draft",
  };
}

export function normalizePagePayload(input: Partial<EditorPage> & { sections?: Array<Partial<EditorSection>> }) {
  const base = createEmptyPage();

  return {
    ...base,
    ...input,
    locale: input.locale ?? base.locale,
    metaTitle: input.metaTitle ?? base.metaTitle,
    metaDescription: input.metaDescription ?? base.metaDescription,
    metaKeywords: input.metaKeywords ?? base.metaKeywords,
    canonicalUrl: input.canonicalUrl ?? base.canonicalUrl,
    robotsDirective: input.robotsDirective ?? base.robotsDirective,
    ogTitle: input.ogTitle ?? base.ogTitle,
    ogDescription: input.ogDescription ?? base.ogDescription,
    ogImageUrl: input.ogImageUrl ?? base.ogImageUrl,
    ogImageAlt: input.ogImageAlt ?? base.ogImageAlt,
    twitterTitle: input.twitterTitle ?? base.twitterTitle,
    twitterDescription: input.twitterDescription ?? base.twitterDescription,
    twitterImageUrl: input.twitterImageUrl ?? base.twitterImageUrl,
    focusKeyword: input.focusKeyword ?? base.focusKeyword,
    secondaryKeywords: input.secondaryKeywords ?? base.secondaryKeywords,
    schemaOrgJson: input.schemaOrgJson ?? base.schemaOrgJson,
    imageRecommendations: input.imageRecommendations ?? base.imageRecommendations,
    sitemapPriority: typeof input.sitemapPriority === "number" ? input.sitemapPriority : base.sitemapPriority,
    sitemapChangeFreq: input.sitemapChangeFreq ?? base.sitemapChangeFreq,
    menuLabel: input.menuLabel ?? base.menuLabel,
    sections: (input.sections ?? []).map((section, sectionIndex) => ({
      id: section.id ?? createId("section"),
      name: section.name ?? `Section ${sectionIndex + 1}`,
      layout: section.layout ?? "default",
      background: section.background ?? "white",
      backgroundImage: section.backgroundImage ?? null,
      order: typeof section.order === "number" ? section.order : sectionIndex,
      blocks: (section.blocks ?? []).map((block, blockIndex) => ({
        id: block.id ?? createId("block"),
        type: (block.type as EditorBlockType | undefined) ?? "text",
        order: typeof block.order === "number" ? block.order : blockIndex,
        content: (block.content as Record<string, string> | undefined) ?? {},
      })),
    })),
  } satisfies EditorPage;
}