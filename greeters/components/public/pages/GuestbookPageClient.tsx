"use client";

import { useState } from "react";

import type { Testimonial } from "@/lib/public-site-data";

export const GuestbookPageClient = ({ items }: { items: Testimonial[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="site-content-shell-narrow site-content-section" data-testid="guestbook-page-content">
      <div className="site-guestbook-list" data-testid="guestbook-page-list">
        {items.map((item, index) => (
          <article key={item.id} className={`site-guestbook-card${index === currentIndex ? " is-active" : ""}`} data-testid={`guestbook-page-card-${item.id}`}>
            <p className="site-testimonial-quote-mark">“</p>
            <p className="site-testimonial-content" data-testid={`guestbook-page-content-${item.id}`}>
              {item.content}
            </p>
            <p className="site-testimonial-author" data-testid={`guestbook-page-author-${item.id}`}>
              {item.author}, {item.location}
            </p>
          </article>
        ))}
      </div>

      <div className="site-testimonial-controls" data-testid="guestbook-page-controls">
        <button type="button" className="site-round-button" onClick={() => setCurrentIndex((value) => (value - 1 + items.length) % items.length)} data-testid="guestbook-page-prev-button">‹</button>
        <div className="site-dot-list" data-testid="guestbook-page-dots">
          {items.map((item, index) => (
            <button key={item.id} type="button" className={`site-dot${index === currentIndex ? " is-active" : ""}`} onClick={() => setCurrentIndex(index)} data-testid={`guestbook-page-dot-${index}`} />
          ))}
        </div>
        <button type="button" className="site-round-button" onClick={() => setCurrentIndex((value) => (value + 1) % items.length)} data-testid="guestbook-page-next-button">›</button>
      </div>
    </div>
  );
};