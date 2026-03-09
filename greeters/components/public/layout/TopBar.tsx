"use client";

import { useEffect, useState } from "react";

import { getBookingUrl } from "@/lib/public-site-data";

export const TopBar = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [bookingUrl, setBookingUrl] = useState(getBookingUrl("fr"));

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 280);
    const host = window.location.hostname;
    const path = host.split(".")[0];
    const locale = ["fr", "en", "de", "es", "it", "ja", "nl", "pt-pt", "zh-hans"].includes(path) ? path : "fr";

    onScroll();
    setBookingUrl(getBookingUrl(locale as Parameters<typeof getBookingUrl>[0]));
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          Réserver une balade
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