"use client";

import { IMAGE_QUALITY_GALLERY, PUBLIC_GALLERY_GRID_SIZES_ATTR } from "@/lib/media/config";
import { useState } from "react";

import type { GalleryImage } from "@/lib/public-site-data";

import { ProgressiveImage } from "../media/ProgressiveImage";

export const GalleryPageClient = ({ items }: { items: GalleryImage[] }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <div className="site-gallery-page-container site-content-section site-gallery-page-content" data-testid="gallery-page-content">
        <div className="site-gallery-grid site-gallery-grid-page" data-testid="gallery-page-grid">
          {items.map((item, index) => (
            <button key={item.id} type="button" className="site-gallery-card" onClick={() => setActiveIndex(index)} data-testid={`gallery-page-card-${item.id}`}>
              <ProgressiveImage src={item.src} alt={item.title} sizes={PUBLIC_GALLERY_GRID_SIZES_ATTR} lowQuality={34} highQuality={IMAGE_QUALITY_GALLERY} className="site-gallery-image" wrapperClassName="site-progressive-image-fill" />
              <span className="site-gallery-overlay">
                <strong>{item.title}</strong>
                <small>{item.date}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeIndex !== null ? (
        <div className="site-modal-backdrop" data-testid="gallery-page-lightbox" onClick={() => setActiveIndex(null)}>
          <div className="site-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="site-modal-close" onClick={() => setActiveIndex(null)} data-testid="gallery-page-close-button">
              ×
            </button>
            <button type="button" className="site-lightbox-arrow is-left" onClick={() => setActiveIndex((value) => (value === null ? 0 : (value - 1 + items.length) % items.length))} data-testid="gallery-page-prev-button">
              ‹
            </button>
            <div className="site-lightbox-media">
              <img src={items[activeIndex].src} alt={items[activeIndex].title} className="site-lightbox-image" data-testid="gallery-page-lightbox-image" />
              <div className="site-lightbox-copy" data-testid="gallery-page-lightbox-copy">
                <strong>{items[activeIndex].title}</strong>
                <span>{items[activeIndex].date}</span>
              </div>
            </div>
            <button type="button" className="site-lightbox-arrow is-right" onClick={() => setActiveIndex((value) => (value === null ? 0 : (value + 1) % items.length))} data-testid="gallery-page-next-button">
              ›
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};