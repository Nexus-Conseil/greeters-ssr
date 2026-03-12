import type { AppLocale } from "@/lib/i18n/config";
import { getBookingUrl } from "@/lib/public-site-data";
import { getHomePageContent } from "@/lib/services/home-content";

import { ActualitesSection } from "./ActualitesSection";
import { GallerySection } from "./GallerySection";
import { GreetersSection } from "./GreetersSection";
import { HeroSection } from "./HeroSection";
import { IntroSection } from "./IntroSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { VisitSection } from "./VisitSection";

export const HomePage = async ({ locale }: { locale: AppLocale }) => {
  const content = await getHomePageContent();
  const bookingUrl = getBookingUrl(locale);

  return (
    <div className="site-main" data-testid="public-home-main-content">
      <HeroSection {...content.hero} />
      <IntroSection {...content.intro} bookingUrl={bookingUrl} />
      <GreetersSection {...content.greeters} bookingUrl={bookingUrl} />
      <VisitSection {...content.visit} />
      <ActualitesSection {...content.actualites} />
      <TestimonialsSection {...content.testimonials} />
      <GallerySection {...content.gallery} />
    </div>
  );
};