"use client";

import { IMAGE_QUALITY_GALLERY, PUBLIC_GALLERY_GRID_SIZES_ATTR } from "@/lib/media/config";
import Link from "next/link";
import { useState } from "react";

import type { GalleryImage } from "@/lib/public-site-data";

import { ProgressiveImage } from "../media/ProgressiveImage";

type GallerySectionProps = {
  title: string;
  items: GalleryImage[];
};

export const GallerySection = ({ title, items }: GallerySectionProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <section className="site-section site-deferred-section" data-testid="public-home-gallery-section">
        <div className="site-container">
          <h2 className="site-section-title" data-testid="public-home-gallery-title">
            {title}
          </h2>
          <div className="site-gallery-grid" data-testid="public-home-gallery-grid">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="site-gallery-card"
                onClick={() => setActiveIndex(index)}
                data-testid={`public-home-gallery-card-${item.id}`}
              >
                <ProgressiveImage src={item.src} alt={item.title} sizes={PUBLIC_GALLERY_GRID_SIZES_ATTR} lowQuality={34} highQuality={IMAGE_QUALITY_GALLERY} className="site-gallery-image" wrapperClassName="site-progressive-image-fill" />
                <span className="site-gallery-overlay">
                  <strong>{item.title}</strong>
                  <small>{item.date}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="site-gallery-link-row">
            <Link href="/galerie" prefetch={false} className="site-outline-link" data-testid="public-home-gallery-link">
              Voir toutes nos galeries photos
            </Link>
          </div>
        </div>
      </section>

      {activeIndex !== null ? (
        <div className="site-modal-backdrop" data-testid="public-home-gallery-lightbox" onClick={() => setActiveIndex(null)}>
          <div className="site-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="site-modal-close" onClick={() => setActiveIndex(null)} data-testid="public-home-gallery-close-button">
              ×
            </button>
            <button
              type="button"
              className="site-lightbox-arrow is-left"
              onClick={() => setActiveIndex((value) => (value === null ? 0 : (value - 1 + items.length) % items.length))}
              data-testid="public-home-gallery-prev-button"
            >
              ‹
            </button>
            <div className="site-lightbox-media">
              <img src={items[activeIndex].src} alt={items[activeIndex].title} className="site-lightbox-image" data-testid="public-home-gallery-lightbox-image" />
              <div className="site-lightbox-copy" data-testid="public-home-gallery-lightbox-copy">
                <strong>{items[activeIndex].title}</strong>
                <span>{items[activeIndex].date}</span>
              </div>
            </div>
            <button
              type="button"
              className="site-lightbox-arrow is-right"
              onClick={() => setActiveIndex((value) => (value === null ? 0 : (value + 1) % items.length))}
              data-testid="public-home-gallery-next-button"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};