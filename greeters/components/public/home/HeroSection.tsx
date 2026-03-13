import Image from "next/image";

import { IMAGE_QUALITY_HERO, PUBLIC_HERO_SIZES_ATTR } from "@/lib/media/config";

type HeroSectionProps = {
  slogan: string;
  subtitle: string;
  image: string;
  imageAlt: string;
};

export const HeroSection = ({ slogan, subtitle, image, imageAlt }: HeroSectionProps) => {
  // Split slogan for responsive display
  // Expected format: "Venez en visiteur, repartez en ami"
  const sloganParts = slogan.split(',');
  const line1 = sloganParts[0]?.trim() + ',' || slogan; // "Venez en visiteur,"
  const line2 = sloganParts[1]?.trim() || '';           // "repartez en ami"
  
  // For mobile: "Venez en" / "visiteur," / "repartez" / "en ami"
  const words1 = (sloganParts[0]?.trim() || '').split(' '); // ["Venez", "en", "visiteur"]
  const words2 = (sloganParts[1]?.trim() || '').split(' '); // ["repartez", "en", "ami"]
  
  return (
    <section className="site-hero" data-testid="public-home-hero-section">
      <div className="site-hero-media" data-testid="public-home-hero-media">
        <Image src={image} alt={imageAlt} width={1920} height={814} sizes={PUBLIC_HERO_SIZES_ATTR} quality={IMAGE_QUALITY_HERO} priority fetchPriority="high" className="site-hero-image" data-testid="public-home-hero-image" />
        <div className="site-hero-overlay" />
        <div className="site-hero-copy" data-testid="public-home-hero-copy">
          <h1 className="site-script-title" data-testid="public-home-hero-title">
            <span className="slogan-full">{slogan}</span>
            <span className="slogan-tablet">
              <span className="slogan-line">{line1}</span>
              <span className="slogan-line">{line2}</span>
            </span>
            <span className="slogan-mobile">
              <span className="slogan-word">{words1.slice(0, 2).join(' ')}</span>
              <span className="slogan-word">{words1[2]},</span>
              <span className="slogan-word">{words2[0]}</span>
              <span className="slogan-word">{words2.slice(1).join(' ')}</span>
            </span>
          </h1>
          <p className="site-hero-subtitle" data-testid="public-home-hero-subtitle">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
};