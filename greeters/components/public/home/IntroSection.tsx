type IntroSectionProps = {
  title: string;
  tagline: string;
  ctaText: string;
  bookingUrl: string;
};

export const IntroSection = ({ title, tagline, ctaText, bookingUrl }: IntroSectionProps) => {
  return (
    <section className="site-section site-section-intro" data-testid="public-home-intro-section">
      <div className="site-container site-centered-stack">
        <h2 className="site-section-title" data-testid="public-home-intro-title">
          {title}
        </h2>
        <p className="site-section-tagline" data-testid="public-home-intro-tagline">
          {tagline}
        </p>
        <a href={bookingUrl} target="_blank" rel="noreferrer" className="site-cta-button site-glow-button" data-testid="public-home-intro-cta-button">
          <span className="site-glow-button-label">{ctaText}</span>
        </a>
      </div>
    </section>
  );
};