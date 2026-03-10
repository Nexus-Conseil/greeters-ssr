"use client";

import { useEffect, useState } from "react";

import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";
import { getPublicCopy } from "@/lib/i18n/site-copy";
import { getBookingUrl } from "@/lib/public-site-data";

export const TopBar = ({ initialLocale = "fr" }: { initialLocale?: AppLocale }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [bookingUrl, setBookingUrl] = useState(getBookingUrl(initialLocale));
  const [bookingLabel, setBookingLabel] = useState(getPublicCopy(initialLocale).bookingCta);

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
        <a
          href={bookingUrl}
          target="_blank"
          rel="noreferrer"
          className="site-topbar-button"
          data-testid="public-site-topbar-cta-button"
        >
          {bookingLabel}
        </a>
      </div>
      <div className="site-topbar-spacer" data-testid="public-site-topbar-spacer" />

      <button
        type="button"
        className={`site-backtotop${showBackToTop ? " is-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        data-testid="public-site-backtotop-button"
      >
        ↑
      </button>
    </>
  );
};