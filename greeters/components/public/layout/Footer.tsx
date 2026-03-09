import Link from "next/link";
import type { Route } from "next";

const FOOTER_LINKS = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous", testId: "qui-sommes-nous" },
  { href: "/devenez-benevole", label: "Devenez bénévole", testId: "devenez-benevole" },
  { href: "/presse", label: "Presse", testId: "presse" },
  { href: "/contact", label: "Contact", testId: "contact" },
  { href: "/mentions-legales", label: "Mentions légales", testId: "mentions-legales" },
];

export const Footer = () => {
  return (
    <footer className="public-footer" data-testid="public-footer">
      <div className="public-footer-grid" data-testid="public-footer-grid">
        <div className="public-footer-panel" data-testid="public-footer-panel-mission">
          <p className="status-label" data-testid="public-footer-mission-label">
            Mission
          </p>
          <p className="public-footer-copy" data-testid="public-footer-mission-copy">
            Le shell public est désormais structuré pour accueillir les futures pages SSR, les blocs CMS et la navigation synchronisée.
          </p>
        </div>
        <div className="public-footer-panel" data-testid="public-footer-panel-links">
          <p className="status-label" data-testid="public-footer-links-label">
            Liens utiles
          </p>
          <div className="public-footer-links" data-testid="public-footer-links-list">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href as Route}
                className="public-footer-link"
                data-testid={`public-footer-link-${link.testId}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};