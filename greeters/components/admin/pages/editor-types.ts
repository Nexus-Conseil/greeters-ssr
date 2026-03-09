import type { AppLocale } from "@/lib/i18n/config";

export type EditorBlockType = "heading" | "text" | "image" | "button";

export type EditorBlock = {
  id: string;
  type: EditorBlockType;
  order: number;
  content: Record<string, string>;
};

export type EditorSection = {
  id: string;
  name: string;
  layout: "default" | "hero" | "two-column" | "cards" | "centered";
  background: "white" | "gray" | "green" | "image";
  backgroundImage: string | null;
  blocks: EditorBlock[];
  order: number;
};

export type EditorPage = {
  id?: string;
  locale: AppLocale;
  title: string;
  slug: string;
  metaDescription: string;
  metaKeywords: string;
  sections: EditorSection[];
  isInMenu: boolean;
  menuOrder: number;
  menuLabel: string;
  status?: "draft" | "pending" | "published" | "archived";
};

export type VersionItem = {
  id: string;
  versionNumber: number;
  status: "draft" | "pending" | "published" | "archived";
  createdByName: string;
  createdAt: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  isCurrent: boolean;
  isPublished: boolean;
  content: EditorPage;
};

export const BLOCK_TYPE_OPTIONS: Array<{ value: EditorBlockType; label: string }> = [
  { value: "heading", label: "Titre" },
  { value: "text", label: "Texte" },
  { value: "image", label: "Image" },
  { value: "button", label: "Bouton" },
];

export const LAYOUT_OPTIONS = [
  { value: "default", label: "Par défaut" },
  { value: "hero", label: "Hero" },
  { value: "two-column", label: "Deux colonnes" },
  { value: "cards", label: "Cartes" },
  { value: "centered", label: "Centré" },
] as const;

export const BACKGROUND_OPTIONS = [
  { value: "white", label: "Blanc" },
  { value: "gray", label: "Gris clair" },
  { value: "green", label: "Vert" },
  { value: "image", label: "Image" },
] as const;