import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { FOOTER_LINKS, PARTNERS, SOCIAL_LINKS } from "@/lib/public-site-data";

export const Footer = () => {
  return (
    <footer className="site-footer" data-testid="public-site-footer">
      <section className="site-footer-social" data-testid="public-site-footer-social">
        <div className="site-container site-centered-stack">
          <h2 className="site-section-title" data-testid="public-site-footer-social-title">
            Rejoignez-nous sur les réseaux sociaux
          </h2>
          <div className="site-social-links" data-testid="public-site-footer-social-links">
            {SOCIAL_LINKS.map((link) => (
              <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className="site-social-link" data-testid={`public-site-footer-social-link-${link.id}`}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="site-footer-partners" data-testid="public-site-footer-partners">
        <div className="site-container">
          <h2 className="site-section-title" data-testid="public-site-footer-partners-title">
            Nos partenaires
          </h2>
        </div>
        <div className="site-partners-marquee" data-testid="public-site-footer-partners-marquee">
          <div className="site-partners-track">
            {[...PARTNERS, ...PARTNERS].map((partner, index) => (
              <a key={`${partner.id}-${index}`} href={partner.link} target="_blank" rel="noreferrer" className="site-partner-link" data-testid={`public-site-footer-partner-${partner.id}-${index}`}>
                <Image src={partner.logo} alt={partner.name} width={200} height={72} className="site-partner-logo" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="site-footer-bottom" data-testid="public-site-footer-bottom">
        <div className="site-container">
          <div className="site-footer-bottom-links" data-testid="public-site-footer-bottom-links">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.id} href={link.href as Route} className="site-footer-link" data-testid={`public-site-footer-link-${link.id}`}>
                {link.label}
              </Link>
            ))}
          </div>
          <p className="site-footer-credit" data-testid="public-site-footer-credit">
            <a href="https://nexus-conseil.ch" target="_blank" rel="noreferrer" data-testid="public-site-footer-credit-link">
              Made with ❤️ by NEXUS
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};