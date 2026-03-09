import Link from "next/link";
import type { Route } from "next";

const PUBLIC_NAV = [
  { href: "/", label: "Accueil" },
  { href: "/galerie", label: "Galerie" },
  { href: "/livre-dor", label: "Livre d’or" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

export const Header = () => {
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
        {PUBLIC_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href as Route}
            className="public-header-link"
            data-testid={`public-header-link-${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};