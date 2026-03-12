import Image from "next/image";

import { IMAGE_QUALITY_HERO, PUBLIC_HERO_SIZES_ATTR } from "@/lib/media/config";

type HeroSectionProps = {
  slogan: string;
  subtitle: string;
  image: string;
  imageAlt: string;
};

export const HeroSection = ({ slogan, subtitle, image, imageAlt }: HeroSectionProps) => {
  return (
    <section className="site-hero" data-testid="public-home-hero-section">
      <div className="site-hero-media" data-testid="public-home-hero-media">
        <Image src={image} alt={imageAlt} width={1920} height={814} sizes={PUBLIC_HERO_SIZES_ATTR} quality={IMAGE_QUALITY_HERO} priority fetchPriority="high" className="site-hero-image" data-testid="public-home-hero-image" />
        <div className="site-hero-overlay" />
        <div className="site-hero-copy" data-testid="public-home-hero-copy">
          <h1 className="site-script-title" data-testid="public-home-hero-title">
            {slogan}
          </h1>
          <p className="site-hero-subtitle" data-testid="public-home-hero-subtitle">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
};