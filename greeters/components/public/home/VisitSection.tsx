import Image from "next/image";

import { IMAGE_QUALITY_STANDARD, PUBLIC_HALF_WIDTH_IMAGE_SIZES_ATTR } from "@/lib/media/config";

type VisitSectionProps = {
  title: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
};

export const VisitSection = ({ title, paragraphs, image, imageAlt }: VisitSectionProps) => {
  return (
    <section className="site-section site-section-muted site-deferred-section" data-testid="public-home-visit-section">
      <div className="site-container site-two-column">
        <div className="site-copy-column" data-testid="public-home-visit-copy">
          <h2 className="site-section-title site-section-title-left" data-testid="public-home-visit-title">
            {title}
          </h2>
          <div className="site-rich-text" data-testid="public-home-visit-paragraphs">
            {paragraphs.map((paragraph, index) => (
              <p key={`${title}-${index}`} data-testid={`public-home-visit-paragraph-${index}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        <div className="site-media-card" data-testid="public-home-visit-image-wrapper">
          <Image src={image} alt={imageAlt} width={1920} height={1280} sizes={PUBLIC_HALF_WIDTH_IMAGE_SIZES_ATTR} quality={IMAGE_QUALITY_STANDARD} className="site-media-image" data-testid="public-home-visit-image" />
        </div>
      </div>
    </section>
  );
};