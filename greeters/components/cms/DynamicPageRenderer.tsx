import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { IMAGE_QUALITY_STANDARD, PUBLIC_IMAGE_SIZES_ATTR } from "@/lib/media/config";

type RenderablePage = {
  sections: Array<any>;
};

type RenderableSection = RenderablePage["sections"][number];
type RenderableBlock = RenderableSection["blocks"][number];

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function sortByOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((left, right) => left.order - right.order);
}

function getSectionClassName(section: RenderableSection) {
  const layoutMap: Record<string, string> = {
    default: "cms-section-inner is-default",
    hero: "cms-section-inner is-hero",
    "two-column": "cms-section-inner is-two-column",
    cards: "cms-section-inner is-cards",
    centered: "cms-section-inner is-centered",
  };
  const layout = layoutMap[section.layout] ?? layoutMap.default;

  return `cms-section cms-section-${section.background} ${layout}`;
}

function renderButton(blockId: string, content: Record<string, string>) {
  const href = asText(content.href) || "/";
  const label = asText(content.text) || "Action";
  const className = `cms-button cms-button-${asText(content.style) || "primary"}`;

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} data-testid={`cms-button-link-${blockId}`}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={className} data-testid={`cms-button-link-${blockId}`}>
      {label}
    </Link>
  );
}

function renderBlock(section: RenderableSection, block: RenderableBlock) {
  const content = (block.content ?? {}) as Record<string, unknown>;
  const textClassName = section.background === "green" || section.background === "image" ? "is-inverse" : "";

  if (block.type === "heading") {
    const headingText = asText(content.text) || "Titre";

    if (asText(content.level) === "h1") {
      return <h1 className={`cms-heading cms-heading-h1 ${textClassName}`} data-testid={`cms-heading-block-${block.id}`}>{headingText}</h1>;
    }

    if (asText(content.level) === "h3") {
      return <h3 className={`cms-heading cms-heading-h3 ${textClassName}`} data-testid={`cms-heading-block-${block.id}`}>{headingText}</h3>;
    }

    return <h2 className={`cms-heading cms-heading-h2 ${textClassName}`} data-testid={`cms-heading-block-${block.id}`}>{headingText}</h2>;
  }

  if (block.type === "text") {
    return (
      <div className={`cms-text ${textClassName}`} data-testid={`cms-text-block-${block.id}`}>
        {asText(content.text).split("\n").map((line, index) => (
          <p key={`${block.id}-${index}`} data-testid={`cms-text-line-${block.id}-${index}`}>
            {line}
          </p>
        ))}
      </div>
    );
  }

  if (block.type === "image") {
    if (!asText(content.src)) {
      return null;
    }

    return (
      <figure className="cms-figure" data-testid={`cms-image-block-${block.id}`}>
        <Image src={asText(content.src)} alt={asText(content.alt) || "Illustration"} width={Number(content.width) || 1400} height={Number(content.height) || 900} sizes={PUBLIC_IMAGE_SIZES_ATTR} quality={IMAGE_QUALITY_STANDARD} className="cms-image" data-testid={`cms-image-block-asset-${block.id}`} />
        {asText(content.caption) ? <figcaption className={`cms-caption ${textClassName}`} data-testid={`cms-image-caption-${block.id}`}>{asText(content.caption)}</figcaption> : null}
      </figure>
    );
  }

  if (block.type === "button") {
    return renderButton(block.id, content as Record<string, string>);
  }

  return null;
}

export const DynamicPageRenderer = ({ page }: { page: RenderablePage }) => {
  return (
    <div className="cms-page" data-testid="cms-dynamic-page">
      {sortByOrder<RenderableSection>(page.sections as RenderableSection[]).map((section) => (
        <section
          key={section.id}
          className={getSectionClassName(section)}
          style={
            section.background === "image" && section.backgroundImage
              ? {
                  backgroundImage: `linear-gradient(rgba(15, 22, 18, 0.64), rgba(15, 22, 18, 0.56)), url(${section.backgroundImage})`,
                }
              : undefined
          }
          data-testid={`cms-section-${section.id}`}
        >
          {sortByOrder<RenderableBlock>(section.blocks as RenderableBlock[]).map((block) => (
            <div className="cms-block" key={block.id} data-testid={`cms-block-${block.id}`}>
              {renderBlock(section, block)}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
};