"use client";

import { useMemo, useState } from "react";

import { extractImageRecommendationsFromSections, SITEMAP_CHANGEFREQ_OPTIONS } from "@/lib/seo/page-seo";
import type { SeoImageRecommendation } from "@/lib/services/pages";

import type { EditorPage } from "./editor-types";

type SeoEditorPanelProps = {
  form: EditorPage;
  onChange: (updater: (current: EditorPage) => EditorPage) => void;
  onError: (message: string) => void;
};

function updateImageAlt(form: EditorPage, recommendation: SeoImageRecommendation, nextAlt: string) {
  const baseRecommendations = form.imageRecommendations.length > 0 ? form.imageRecommendations : extractImageRecommendationsFromSections(form.sections, form.slug || "nouvelle-page");

  return {
    ...form,
    sections: form.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) =>
        block.id === recommendation.blockId
          ? {
              ...block,
              content: {
                ...block.content,
                alt: nextAlt,
              },
            }
          : block,
      ),
    })),
    imageRecommendations: baseRecommendations.map((entry) =>
      entry.blockId === recommendation.blockId ? { ...entry, suggestedAlt: nextAlt } : entry,
    ),
  } satisfies EditorPage;
}

export const SeoEditorPanel = ({ form, onChange, onError }: SeoEditorPanelProps) => {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const recommendations = useMemo(
    () => (form.imageRecommendations.length > 0 ? form.imageRecommendations : extractImageRecommendationsFromSections(form.sections, form.slug || "nouvelle-page")),
    [form.imageRecommendations, form.sections, form.slug],
  );

  const seoScore = useMemo(() => {
    const checks = [
      Boolean(form.metaTitle),
      Boolean(form.metaDescription),
      Boolean(form.focusKeyword),
      Boolean(form.canonicalUrl),
      Boolean(form.robotsDirective),
      Boolean(form.ogTitle),
      Boolean(form.ogDescription),
      Boolean(form.schemaOrgJson),
      recommendations.every((item) => Boolean(item.suggestedAlt)),
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, recommendations]);

  async function handleOptimize() {
    setLoading(true);
    setNotice("");
    onError("");

    try {
      const response = await fetch("/api/ai/seo-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: form,
          locale: form.locale,
          instructions,
        }),
      });

      const payload = (await response.json()) as {
        detail?: string;
        optimization?: {
          metaTitle: string;
          metaDescription: string;
          focusKeyword: string;
          secondaryKeywords: string;
          canonicalUrl: string;
          robotsDirective: string;
          ogTitle: string;
          ogDescription: string;
          ogImageUrl: string | null;
          ogImageAlt: string | null;
          twitterTitle: string;
          twitterDescription: string;
          twitterImageUrl: string | null;
          schemaOrgJson: string;
          sitemapPriority: number;
          sitemapChangeFreq: string;
          imageRecommendations: SeoImageRecommendation[];
          optimizationSummary: string;
        };
      };

      if (!response.ok || !payload.optimization) {
        throw new Error(payload.detail ?? "Optimisation SEO impossible.");
      }

      onChange((current) => ({
        ...current,
        metaTitle: payload.optimization?.metaTitle ?? current.metaTitle,
        metaDescription: payload.optimization?.metaDescription ?? current.metaDescription,
        focusKeyword: payload.optimization?.focusKeyword ?? current.focusKeyword,
        secondaryKeywords: payload.optimization?.secondaryKeywords ?? current.secondaryKeywords,
        canonicalUrl: payload.optimization?.canonicalUrl ?? current.canonicalUrl,
        robotsDirective: payload.optimization?.robotsDirective ?? current.robotsDirective,
        ogTitle: payload.optimization?.ogTitle ?? current.ogTitle,
        ogDescription: payload.optimization?.ogDescription ?? current.ogDescription,
        ogImageUrl: payload.optimization?.ogImageUrl ?? current.ogImageUrl,
        ogImageAlt: payload.optimization?.ogImageAlt ?? current.ogImageAlt,
        twitterTitle: payload.optimization?.twitterTitle ?? current.twitterTitle,
        twitterDescription: payload.optimization?.twitterDescription ?? current.twitterDescription,
        twitterImageUrl: payload.optimization?.twitterImageUrl ?? current.twitterImageUrl,
        schemaOrgJson: payload.optimization?.schemaOrgJson ?? current.schemaOrgJson,
        sitemapPriority: payload.optimization?.sitemapPriority ?? current.sitemapPriority,
        sitemapChangeFreq: payload.optimization?.sitemapChangeFreq ?? current.sitemapChangeFreq,
        imageRecommendations: payload.optimization?.imageRecommendations ?? current.imageRecommendations,
        sections: current.sections.map((section) => ({
          ...section,
          blocks: section.blocks.map((block) => {
            const match = payload.optimization?.imageRecommendations?.find((entry) => entry.blockId === block.id && entry.suggestedAlt);
            return match
              ? {
                  ...block,
                  content: {
                    ...block.content,
                    alt: match.suggestedAlt ?? block.content.alt,
                  },
                }
              : block;
          }),
        })),
      }));

      setNotice(payload.optimization.optimizationSummary);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Optimisation SEO impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="editor-panel" data-testid="page-editor-seo-panel">
      <div className="dashboard-row-spread" data-testid="page-editor-seo-header">
        <div>
          <p className="status-label" data-testid="page-editor-seo-label">Studio SEO</p>
          <p className="dashboard-row-title" data-testid="page-editor-seo-title">Score de complétude : {seoScore}%</p>
        </div>
        <button type="button" className="secondary-button dashboard-inline-button" onClick={() => void handleOptimize()} disabled={loading} data-testid="page-editor-seo-ai-button">
          {loading ? "Analyse IA..." : "Optimiser via IA"}
        </button>
      </div>

      {notice ? <div className="dashboard-success" data-testid="page-editor-seo-success-message">{notice}</div> : null}

      <div className="editor-grid" data-testid="page-editor-seo-grid">
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-meta-title-label">Meta title</span><input value={form.metaTitle} onChange={(event) => onChange((current) => ({ ...current, metaTitle: event.target.value }))} data-testid="page-editor-meta-title-input" /></label>
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-meta-description-label-advanced">Meta description</span><textarea rows={3} value={form.metaDescription} onChange={(event) => onChange((current) => ({ ...current, metaDescription: event.target.value }))} data-testid="page-editor-meta-description-input-advanced" /></label>
        <label className="dashboard-field"><span data-testid="page-editor-focus-keyword-label">Mot-clé principal</span><input value={form.focusKeyword} onChange={(event) => onChange((current) => ({ ...current, focusKeyword: event.target.value }))} data-testid="page-editor-focus-keyword-input" /></label>
        <label className="dashboard-field"><span data-testid="page-editor-secondary-keywords-label">Mots-clés secondaires</span><input value={form.secondaryKeywords} onChange={(event) => onChange((current) => ({ ...current, secondaryKeywords: event.target.value }))} data-testid="page-editor-secondary-keywords-input" /></label>
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-canonical-url-label">URL canonique</span><input value={form.canonicalUrl} onChange={(event) => onChange((current) => ({ ...current, canonicalUrl: event.target.value }))} data-testid="page-editor-canonical-url-input" /></label>
        <label className="dashboard-field"><span data-testid="page-editor-robots-label">Robots</span><input value={form.robotsDirective} onChange={(event) => onChange((current) => ({ ...current, robotsDirective: event.target.value }))} data-testid="page-editor-robots-input" /></label>
        <label className="dashboard-field"><span data-testid="page-editor-sitemap-priority-label">Priorité sitemap</span><input type="number" min="0" max="1" step="0.1" value={form.sitemapPriority} onChange={(event) => onChange((current) => ({ ...current, sitemapPriority: Number(event.target.value) || 0 }))} data-testid="page-editor-sitemap-priority-input" /></label>
        <label className="dashboard-field"><span data-testid="page-editor-sitemap-frequency-label">Fréquence sitemap</span><select value={form.sitemapChangeFreq} onChange={(event) => onChange((current) => ({ ...current, sitemapChangeFreq: event.target.value }))} data-testid="page-editor-sitemap-frequency-select">{SITEMAP_CHANGEFREQ_OPTIONS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-seo-instructions-label">Consignes IA SEO</span><textarea rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Ex: prioriser un ton institutionnel, renforcer la longue traîne, produire un FAQPage schema.org..." data-testid="page-editor-seo-instructions-input" /></label>
      </div>

      <div className="editor-grid" data-testid="page-editor-social-grid">
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-og-title-label">Open Graph title</span><input value={form.ogTitle} onChange={(event) => onChange((current) => ({ ...current, ogTitle: event.target.value }))} data-testid="page-editor-og-title-input" /></label>
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-og-description-label">Open Graph description</span><textarea rows={3} value={form.ogDescription} onChange={(event) => onChange((current) => ({ ...current, ogDescription: event.target.value }))} data-testid="page-editor-og-description-input" /></label>
        <label className="dashboard-field"><span data-testid="page-editor-og-image-url-label">Open Graph image URL</span><input value={form.ogImageUrl} onChange={(event) => onChange((current) => ({ ...current, ogImageUrl: event.target.value }))} data-testid="page-editor-og-image-url-input" /></label>
        <label className="dashboard-field"><span data-testid="page-editor-og-image-alt-label">Open Graph image Alt</span><input value={form.ogImageAlt} onChange={(event) => onChange((current) => ({ ...current, ogImageAlt: event.target.value }))} data-testid="page-editor-og-image-alt-input" /></label>
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-twitter-title-label">Twitter title</span><input value={form.twitterTitle} onChange={(event) => onChange((current) => ({ ...current, twitterTitle: event.target.value }))} data-testid="page-editor-twitter-title-input" /></label>
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-twitter-description-label">Twitter description</span><textarea rows={3} value={form.twitterDescription} onChange={(event) => onChange((current) => ({ ...current, twitterDescription: event.target.value }))} data-testid="page-editor-twitter-description-input" /></label>
        <label className="dashboard-field dashboard-field-full"><span data-testid="page-editor-twitter-image-url-label">Twitter image URL</span><input value={form.twitterImageUrl} onChange={(event) => onChange((current) => ({ ...current, twitterImageUrl: event.target.value }))} data-testid="page-editor-twitter-image-url-input" /></label>
      </div>

      <label className="dashboard-field dashboard-field-full" data-testid="page-editor-schema-field">
        <span data-testid="page-editor-schema-label">schema.org JSON-LD</span>
        <textarea rows={10} value={form.schemaOrgJson} onChange={(event) => onChange((current) => ({ ...current, schemaOrgJson: event.target.value }))} data-testid="page-editor-schema-input" />
      </label>

      <div className="editor-image-seo-stack" data-testid="page-editor-image-seo-stack">
        {recommendations.map((recommendation, index) => (
          <article key={recommendation.blockId} className="editor-image-seo-card" data-testid={`page-editor-image-seo-card-${index}`}>
            <p className="status-label">Image {index + 1}</p>
            <p className="dashboard-row-meta" data-testid={`page-editor-image-current-src-${index}`}>{recommendation.currentSrc || "Aucune image"}</p>
            <div className="editor-grid">
              <label className="dashboard-field"><span>Nom de fichier SEO</span><input value={recommendation.suggestedFileName ?? ""} onChange={(event) => onChange((current) => ({ ...current, imageRecommendations: recommendations.map((entry) => entry.blockId === recommendation.blockId ? { ...entry, suggestedFileName: event.target.value } : entry) }))} data-testid={`page-editor-image-filename-input-${index}`} /></label>
              <label className="dashboard-field"><span>Balise Alt</span><input value={recommendation.suggestedAlt ?? ""} onChange={(event) => onChange((current) => updateImageAlt(current, recommendation, event.target.value))} data-testid={`page-editor-image-alt-input-${index}`} /></label>
              <label className="dashboard-field dashboard-field-full"><span>Titre image</span><input value={recommendation.suggestedTitle ?? ""} onChange={(event) => onChange((current) => ({ ...current, imageRecommendations: recommendations.map((entry) => entry.blockId === recommendation.blockId ? { ...entry, suggestedTitle: event.target.value } : entry) }))} data-testid={`page-editor-image-title-input-${index}`} /></label>
            </div>
            {recommendation.reason ? <p className="dashboard-row-meta" data-testid={`page-editor-image-reason-${index}`}>{recommendation.reason}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
};