import Link from "next/link";
import type { Route } from "next";

import { getRequestLocale } from "@/lib/i18n/request";
import { getMenu } from "@/lib/services/menu";

const FALLBACK_NAV = [
  { href: "/", label: "Accueil", testId: "accueil", isExternal: false },
  { href: "/galerie", label: "Galerie", testId: "galerie", isExternal: false },
  { href: "/livre-dor", label: "Livre d’or", testId: "livre-dor", isExternal: false },
  { href: "/actualites", label: "Actualités", testId: "actualites", isExternal: false },
  { href: "/contact", label: "Contact", testId: "contact", isExternal: false },
];

function toTestId(href: string) {
  return href.replace(/^\//, "").replace(/[^a-z0-9/-]+/gi, "-").replace(/\//g, "-") || "accueil";
}

export const Header = async () => {
  const locale = await getRequestLocale();
  const navigation = await getMenu(locale)
    .then((menu) =>
      menu.items.map((item) => ({
        href: item.href,
        label: item.label,
        isExternal: item.isExternal,
        testId: toTestId(item.href),
      })),
    )
    .catch(() => FALLBACK_NAV);

  return (
    <header className="public-header" data-testid="public-header">
      <div className="public-header-brand" data-testid="public-header-brand">
        <p className="eyebrow" data-testid="public-header-eyebrow">
          Paris Greeters
        </p>
        <h1 className="public-header-title" data-testid="public-header-title">
          Shell public prêt pour le portage SSR.
        </h1>
      </div>

      <nav className="public-header-nav" data-testid="public-header-navigation">
        {navigation.map((item) =>
          item.isExternal ? (
            <a key={item.href} href={item.href} className="public-header-link" target="_blank" rel="noreferrer" data-testid={`public-header-link-${item.testId}`}>
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href as Route} className="public-header-link" data-testid={`public-header-link-${item.testId}`}>
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
};