"use client";

import { useEffect, useState } from "react";

import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";
import { getPublicCopy } from "@/lib/i18n/site-copy";
import { getBookingUrl } from "@/lib/public-site-data";

export const TopBar = ({ initialLocale = "fr" }: { initialLocale?: AppLocale }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [bookingUrl, setBookingUrl] = useState(getBookingUrl(initialLocale));
  const [bookingLabel, setBookingLabel] = useState(getPublicCopy(initialLocale).bookingCta);

  const scrollToTop = () => {
    const duration = 1000;
    const start = window.scrollY;
    const startTime = performance.now();
    const easeOutQuint = (progress: number) => 1 - Math.pow(1 - progress, 5);

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);

      window.scrollTo(0, start * (1 - easedProgress));

      if (progress < 1) {
        window.requestAnimationFrame(animateScroll);
      }
    };

    window.requestAnimationFrame(animateScroll);
  };

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 280);
    const host = window.location.hostname;
    const path = host.split(".")[0];
    const locale = (SUPPORTED_LOCALES as readonly string[]).includes(path) ? (path as AppLocale) : initialLocale;

    onScroll();
    setBookingUrl(getBookingUrl(locale));
    setBookingLabel(getPublicCopy(locale).bookingCta);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [initialLocale]);

  return (
    <>
      <div className="site-topbar" data-testid="public-site-topbar">
        <div className="site-topbar-inner">
          <a href={bookingUrl} target="_blank" rel="noreferrer" className="site-topbar-button site-glow-button" data-testid="public-site-topbar-cta-button">
            <span className="site-glow-button-label">{bookingLabel}</span>
          </a>
        </div>
      </div>
      <div className="site-topbar-spacer" data-testid="public-site-topbar-spacer" />

      <button
        type="button"
        className={`site-backtotop${showBackToTop ? " is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Retour en haut"
        data-testid="public-site-backtotop-button"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6 5 13l1.4 1.4 4.6-4.6V20h2V9.8l4.6 4.6L19 13 12 6Z" fill="currentColor" />
        </svg>
      </button>
    </>
  );
};