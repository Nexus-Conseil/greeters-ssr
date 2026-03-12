"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import type { GalleryImage } from "@/lib/public-site-data";

export const GalleryPageClient = ({ items }: { items: GalleryImage[] }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-12" data-testid="gallery-page-content">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="gallery-page-grid">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => setActiveIndex(index)}
              data-testid={`gallery-page-card-${item.id}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setActiveIndex(null)}
          data-testid="gallery-page-lightbox"
        >
          <button
            onClick={() => setActiveIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-[#8bc34a] transition-colors z-10"
            data-testid="gallery-page-close-button"
          >
            <X size={32} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveIndex((v) => (v === null ? 0 : (v - 1 + items.length) % items.length)); }}
            className="absolute left-4 text-white hover:text-[#8bc34a] transition-colors z-10"
            data-testid="gallery-page-prev-button"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveIndex((v) => (v === null ? 0 : (v + 1) % items.length)); }}
            className="absolute right-4 text-white hover:text-[#8bc34a] transition-colors z-10"
            data-testid="gallery-page-next-button"
          >
            <ChevronRight size={40} />
          </button>
          <div className="max-w-4xl max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[activeIndex].src}
              alt={items[activeIndex].title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              decoding="async"
              data-testid="gallery-page-lightbox-image"
            />
            <div className="text-center mt-4" data-testid="gallery-page-lightbox-copy">
              <p className="text-white font-medium">{items[activeIndex].title}</p>
              <p className="text-white/70 text-sm">{items[activeIndex].date}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
