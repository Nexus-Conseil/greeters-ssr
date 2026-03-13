"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import type { AppLocale } from "@/lib/i18n/config";
import { buildLocaleUrl, LOCALE_LABELS } from "@/lib/i18n/config";
import { IMAGE_QUALITY_STANDARD, PUBLIC_LOGO_SIZES_ATTR } from "@/lib/media/config";
import { getBookingUrl, type SiteNavigationItem } from "@/lib/public-site-data";

const FLAG_MARKUP: Record<AppLocale, string> = {
  fr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect fill="#002654" width="1" height="2"/><rect fill="#fff" x="1" width="1" height="2"/><rect fill="#ce1126" x="2" width="1" height="2"/></svg>`,
  en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect fill="#012169" width="30" height="20"/><path stroke="#fff" stroke-width="4" d="M0 0l30 20M30 0L0 20"/><path stroke="#C8102E" stroke-width="1.5" d="M0 0l10 6.67m10 6.66l10 6.67M30 0L20 6.67M10 13.33L0 20"/><path stroke="#fff" stroke-width="6.67" d="M15 0v20M0 10h30"/><path stroke="#C8102E" stroke-width="4" d="M15 0v20M0 10h30"/></svg>`,
  de: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3"><rect fill="#000" width="5" height="3"/><rect fill="#D00" y="1" width="5" height="2"/><rect fill="#FFCE00" y="2" width="5" height="1"/></svg>`,
  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect fill="#c60b1e" width="3" height="2"/><rect fill="#ffc400" y="0.5" width="3" height="1"/></svg>`,
  it: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect fill="#009246" width="1" height="2"/><rect fill="#fff" x="1" width="1" height="2"/><rect fill="#ce2b37" x="2" width="1" height="2"/></svg>`,
  ja: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect fill="#fff" width="3" height="2"/><circle fill="#bc002d" cx="1.5" cy="1" r="0.6"/></svg>`,
  nl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect fill="#21468B" width="3" height="2"/><rect fill="#fff" width="3" height="1.33"/><rect fill="#AE1C28" width="3" height="0.67"/></svg>`,
  "pt-pt": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect fill="#006600" width="1.2" height="2"/><rect fill="#ff0000" x="1.2" width="1.8" height="2"/><circle fill="#ffcc00" cx="1.2" cy="1" r="0.4"/></svg>`,
  "zh-hans": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect fill="#de2910" width="30" height="20"/><g fill="#ffde00"><polygon points="5,4 5.6,6 7.5,6 6,7.2 6.5,9 5,8 3.5,9 4,7.2 2.5,6 4.4,6"/><polygon points="9,2 9.3,3 10.2,3 9.5,3.6 9.8,4.6 9,4 8.2,4.6 8.5,3.6 7.8,3 8.7,3"/><polygon points="11,4.5 11.3,5.5 12.2,5.5 11.5,6.1 11.8,7.1 11,6.5 10.2,7.1 10.5,6.1 9.8,5.5 10.7,5.5"/><polygon points="11,7.5 11.3,8.5 12.2,8.5 11.5,9.1 11.8,10.1 11,9.5 10.2,10.1 10.5,9.1 9.8,8.5 10.7,8.5"/><polygon points="9,10 9.3,11 10.2,11 9.5,11.6 9.8,12.6 9,12 8.2,12.6 8.5,11.6 7.8,11 8.7,11"/></g></svg>`,
};

function toTestId(href: string) {
  return href.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "home";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderClientProps = {
  currentLocale: AppLocale;
  initialPathname?: string;
  navigation: SiteNavigationItem[];
};

const MenuGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z" fill="currentColor" />
  </svg>
);

const CloseGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z" fill="currentColor" />
  </svg>
);

export const HeaderClient = ({ currentLocale, initialPathname = "/", navigation }: HeaderClientProps) => {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [resolvedPathname, setResolvedPathname] = useState(initialPathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMenuText, setShowMenuText] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    setResolvedPathname(pathname ?? initialPathname);
  }, [initialPathname, isHydrated, pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [resolvedPathname]);

  useEffect(() => {
    if (!isHydrated || mobileMenuOpen) {
      return;
    }

    const interval = window.setInterval(() => {
      setShowMenuText((previous) => !previous);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isHydrated, mobileMenuOpen]);

  const resolvedNavigation = useMemo(() => {
    return navigation
      .filter((item) => item.isVisible)
      .sort((left, right) => left.order - right.order);
  }, [navigation]);

  const currentPathname = resolvedPathname || "/";

  return (
    <header className="site-header" data-testid="public-site-header">
      <div className="site-language-strip" data-testid="public-site-language-strip">
        <div className="site-language-list" data-testid="public-site-language-list">
          {(Object.keys(LOCALE_LABELS) as AppLocale[]).map((locale) => (
            <a
              key={locale}
              href={buildLocaleUrl(locale, currentPathname)}
              className={`site-language-link${locale === currentLocale ? " is-active" : ""}`}
              title={LOCALE_LABELS[locale]}
              data-testid={`language-switch-${locale}`}
            >
              <span className="site-language-flag" dangerouslySetInnerHTML={{ __html: FLAG_MARKUP[locale] }} />
            </a>
          ))}
        </div>
      </div>

      <div className="site-header-brand" data-testid="public-site-header-brand">
        <Link href="/" data-testid="public-site-logo-link">
          <Image src="/images/logo_greeters.png" alt="Paris Greeters" width={200} height={80} sizes={PUBLIC_LOGO_SIZES_ATTR} quality={IMAGE_QUALITY_STANDARD} className="site-header-logo" priority data-testid="public-site-logo" />
        </Link>
      </div>

      <nav className="site-nav site-nav-desktop" data-testid="public-site-navigation-desktop">
        {resolvedNavigation.map((item) => {
          const href = item.href === "BOOKING_URL_PLACEHOLDER" ? getBookingUrl(currentLocale) : item.href;
          const active = !item.isExternal && isActivePath(currentPathname, item.href);

          return item.isExternal ? (
            <a key={item.id} href={href} target="_blank" rel="noreferrer" className="site-nav-link" data-testid={`public-site-nav-link-${toTestId(item.href)}`}>
              {item.label}
            </a>
          ) : (
            <Link key={item.id} href={item.href as Route} prefetch={false} className={`site-nav-link${active ? " is-active" : ""}`} data-testid={`public-site-nav-link-${toTestId(item.href)}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="site-mobile-header" data-testid="public-site-mobile-header">
        <button
          type="button"
          className="site-mobile-toggle"
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          data-testid="public-site-mobile-menu-button"
        >
          {mobileMenuOpen ? (
            <span className="site-mobile-toggle-close" data-testid="public-site-mobile-menu-close-icon">
              <CloseGlyph />
            </span>
          ) : (
            <span className="site-mobile-toggle-shell">
              <span className={`site-mobile-toggle-icon${showMenuText ? " is-hidden" : ""}`} data-testid="public-site-mobile-menu-open-icon">
                <MenuGlyph />
              </span>
              <span className={`site-mobile-toggle-label${showMenuText ? " is-visible" : ""}`} data-testid="public-site-mobile-menu-label">
                MENU
              </span>
            </span>
          )}
        </button>
      </div>

      {mobileMenuOpen ? (
        <nav className="site-nav site-nav-mobile" data-testid="public-site-navigation-mobile">
          {resolvedNavigation.map((item) => {
            const href = item.href === "BOOKING_URL_PLACEHOLDER" ? getBookingUrl(currentLocale) : item.href;

            return item.isExternal ? (
              <a key={item.id} href={href} target="_blank" rel="noreferrer" className="site-mobile-link" data-testid={`public-site-mobile-link-${toTestId(item.href)}`}>
                {item.label}
              </a>
            ) : (
              <Link key={item.id} href={item.href as Route} prefetch={false} className={`site-mobile-link${isActivePath(currentPathname, item.href) ? " is-active" : ""}`} data-testid={`public-site-mobile-link-${toTestId(item.href)}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
};