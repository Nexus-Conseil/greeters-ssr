"use client";

import Image from "next/image";

import { IMAGE_QUALITY_GALLERY, PUBLIC_GALLERY_GRID_SIZES_ATTR, PUBLIC_LIGHTBOX_IMAGE_SIZES_ATTR } from "@/lib/media/config";
import { useState } from "react";

import type { GalleryImage } from "@/lib/public-site-data";

export const GalleryPageClient = ({ items }: { items: GalleryImage[] }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <div className="site-gallery-page-container site-content-section site-gallery-page-content" data-testid="gallery-page-content">
        <div className="site-gallery-grid site-gallery-grid-page" data-testid="gallery-page-grid">
          {items.map((item, index) => (
            <button key={item.id} type="button" className="site-gallery-card" onClick={() => setActiveIndex(index)} data-testid={`gallery-page-card-${item.id}`}>
              <Image src={item.src} alt={item.title} width={520} height={520} sizes={PUBLIC_GALLERY_GRID_SIZES_ATTR} quality={IMAGE_QUALITY_GALLERY} className="site-gallery-image" data-testid={`gallery-page-image-${item.id}`} />
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
              <Image src={items[activeIndex].src} alt={items[activeIndex].title} width={1200} height={900} sizes={PUBLIC_LIGHTBOX_IMAGE_SIZES_ATTR} quality={IMAGE_QUALITY_GALLERY} className="site-lightbox-image" data-testid="gallery-page-lightbox-image" />
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