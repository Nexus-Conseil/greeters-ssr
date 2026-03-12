"use client";

import { useState } from "react";

import type { Testimonial } from "@/lib/public-site-data";

type TestimonialsSectionProps = {
  title: string;
  items: Testimonial[];
};

export const TestimonialsSection = ({ title, items }: TestimonialsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTestimonial = items[currentIndex];

  return (
    <section className="site-section site-section-muted site-deferred-section" data-testid="public-home-testimonials-section">
      <div className="site-container site-testimonial-shell">
        <h2 className="site-section-title" data-testid="public-home-testimonials-title">
          {title}
        </h2>
        <article className="site-testimonial-card" data-testid="public-home-testimonial-card">
          <p className="site-testimonial-quote-mark">“</p>
          <p className="site-testimonial-content" data-testid="public-home-testimonial-content">
            {currentTestimonial.content}
          </p>
          <p className="site-testimonial-author" data-testid="public-home-testimonial-author">
            {currentTestimonial.author}, {currentTestimonial.location}
          </p>
        </article>

        <div className="site-testimonial-controls" data-testid="public-home-testimonial-controls">
          <button
            type="button"
            className="site-round-button"
            onClick={() => setCurrentIndex((value) => (value - 1 + items.length) % items.length)}
            aria-label="Témoignage précédent"
            data-testid="public-home-testimonial-prev-button"
          >
            ‹
          </button>

          <div className="site-dot-list" data-testid="public-home-testimonial-dots">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`site-dot${index === currentIndex ? " is-active" : ""}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Afficher le témoignage ${index + 1}`}
                data-testid={`public-home-testimonial-dot-${index}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="site-round-button"
            onClick={() => setCurrentIndex((value) => (value + 1) % items.length)}
            aria-label="Témoignage suivant"
            data-testid="public-home-testimonial-next-button"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
};