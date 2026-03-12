"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

import type { Testimonial } from "@/lib/public-site-data";

export const GuestbookPageClient = ({ items }: { items: Testimonial[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <section className="py-12" data-testid="guestbook-page-content">
      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-8" data-testid="guestbook-page-list">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`bg-gray-50 rounded-lg p-8 relative transition-all duration-500 ${
                index === currentIndex ? "opacity-100" : "opacity-60"
              }`}
              data-testid={`guestbook-page-card-${item.id}`}
            >
              <Quote className="absolute top-4 left-4 w-6 h-6 text-[#8bc34a]/30" />
              <div className="pl-8">
                <p className="text-gray-600 italic leading-relaxed mb-4" data-testid={`guestbook-page-content-${item.id}`}>
                  {item.content}
                </p>
                <div className="text-gray-800 font-medium text-sm" data-testid={`guestbook-page-author-${item.id}`}>
                  {item.author}, {item.location}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-center items-center gap-4 mt-8" data-testid="guestbook-page-controls">
          <button
            onClick={() => setCurrentIndex((v) => (v - 1 + items.length) % items.length)}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-[#8bc34a] hover:text-[#8bc34a] transition-colors"
            aria-label="Précédent"
            data-testid="guestbook-page-prev-button"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-2" data-testid="guestbook-page-dots">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-[#8bc34a]" : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Témoignage ${index + 1}`}
                data-testid={`guestbook-page-dot-${index}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((v) => (v + 1) % items.length)}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:border-[#8bc34a] hover:text-[#8bc34a] transition-colors"
            aria-label="Suivant"
            data-testid="guestbook-page-next-button"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};
