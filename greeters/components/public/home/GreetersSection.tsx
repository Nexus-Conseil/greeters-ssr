"use client";

import Image from "next/image";
import { useState } from "react";

type GreetersSectionProps = {
  title: string;
  subtitle: string;
  paragraphs: string[];
  ctaText: string;
  bookingUrl: string;
  image: string;
  imageAlt: string;
  videoThumbnail: string;
  videoTitle: string;
  videoId: string;
};

export const GreetersSection = ({
  title,
  subtitle,
  paragraphs,
  ctaText,
  bookingUrl,
  image,
  imageAlt,
  videoThumbnail,
  videoTitle,
  videoId,
}: GreetersSectionProps) => {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <section className="site-section site-section-muted" data-testid="public-home-video-section">
        <div className="site-container site-centered-stack">
          <h2 className="site-section-title" data-testid="public-home-video-title">
            {subtitle}
          </h2>
          <button type="button" className="site-video-card" onClick={() => setVideoOpen(true)} data-testid="public-home-video-trigger">
            <Image src={videoThumbnail} alt={videoTitle} fill sizes="(max-width: 1024px) 100vw, 840px" className="site-video-thumbnail" unoptimized />
            <span className="site-play-button" data-testid="public-home-video-play-button">
              ▶
            </span>
            <span className="site-video-label" data-testid="public-home-video-label">
              {videoTitle}
            </span>
          </button>
        </div>
      </section>

      <section className="site-section" data-testid="public-home-greeters-section">
        <div className="site-container site-two-column">
          <div className="site-media-card" data-testid="public-home-greeters-image-wrapper">
            <Image src={image} alt={imageAlt} width={800} height={532} className="site-media-image" data-testid="public-home-greeters-image" />
          </div>
          <div className="site-copy-column" data-testid="public-home-greeters-copy">
            <h2 className="site-section-title site-section-title-left" data-testid="public-home-greeters-title">
              {title}
            </h2>
            <div className="site-rich-text" data-testid="public-home-greeters-paragraphs">
              {paragraphs.map((paragraph, index) => (
                <p key={`${title}-${index}`} data-testid={`public-home-greeters-paragraph-${index}`}>
                  {paragraph}
                </p>
              ))}
            </div>
            <a href={bookingUrl} target="_blank" rel="noreferrer" className="site-cta-button site-cta-button-inline" data-testid="public-home-greeters-cta-button">
              {ctaText}
            </a>
          </div>
        </div>
      </section>

      {videoOpen ? (
        <div className="site-modal-backdrop" data-testid="public-home-video-modal" onClick={() => setVideoOpen(false)}>
          <div className="site-modal-panel" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="site-modal-close" onClick={() => setVideoOpen(false)} data-testid="public-home-video-close-button">
              ×
            </button>
            <div className="site-modal-iframe">
              <iframe
                src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1`}
                title={videoTitle}
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                allowFullScreen
                className="site-video-iframe"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};