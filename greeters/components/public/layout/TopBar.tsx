"use client";

import { useEffect, useState } from "react";

export const TopBar = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="public-topbar" data-testid="public-topbar">
        <a
          href="https://gestion.parisiendunjour.fr/visits/new?nt=pdj&locale=fr"
          target="_blank"
          rel="noreferrer"
          className="primary-button public-topbar-button"
          data-testid="public-topbar-cta"
        >
          Réserver une balade
        </a>
      </div>
      <div className="public-topbar-spacer" data-testid="public-topbar-spacer" />

      <button
        type="button"
        className={`public-backtotop${showBackToTop ? " is-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        data-testid="public-backtotop-button"
      >
        Haut de page
      </button>
    </>
  );
};