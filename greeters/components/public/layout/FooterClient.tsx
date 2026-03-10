"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import type { getPublicCopy } from "@/lib/i18n/site-copy";
import type { Partner, SocialLink } from "@/lib/public-site-data";

const PAGES_WITH_FULL_FOOTER = ["/", "/livre-dor", "/faire-un-don", "/devenez-benevole", "/qui-sommes-nous"];
const PAGES_WITH_SOCIAL_ONLY = ["/galerie", "/actualites"];

type FooterLink = {
  id: string;
  label: string;
  href: string;
};

type FooterClientProps = {
  copy: ReturnType<typeof getPublicCopy>;
  footerLinks: FooterLink[];
  partners: Partner[];
  socialLinks: SocialLink[];
};

const iconMarkup: Record<string, string> = {
  facebook:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7h2.3l.5-3h-2.8V9.3c0-.9.3-1.5 1.6-1.5H16V5.1c-.2 0-.9-.1-1.8-.1-2.6 0-4.2 1.5-4.2 4.4V11H7.5v3H10v7h3.5Z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm9.9 1.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z"/></svg>',
  youtube:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 8.2c-.2-.9-.9-1.6-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9.8 2 12 2 12s0 2.2.4 3.8c.2.9.9 1.6 1.8 1.8C5.8 18 12 18 12 18s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-3.8.4-3.8s0-2.2-.4-3.8ZM10 14.8V9.2L15 12l-5 2.8Z"/></svg>',
};

function showFooterSections(pathname: string) {
  const isNewsDetail = pathname.startsWith("/actualites/");
  const showSocialSection = PAGES_WITH_FULL_FOOTER.includes(pathname) || PAGES_WITH_SOCIAL_ONLY.includes(pathname) || isNewsDetail;
  const showPartnersSection = PAGES_WITH_FULL_FOOTER.includes(pathname);

  return { showSocialSection, showPartnersSection };
}

export const FooterClient = ({ copy, footerLinks, partners, socialLinks }: FooterClientProps) => {
  const pathname = usePathname() ?? "/";
  const { showSocialSection, showPartnersSection } = showFooterSections(pathname);

  return (
    <footer className="site-footer" data-testid="public-site-footer">
      {showSocialSection ? (
        <section className="site-footer-social" data-testid="public-site-footer-social">
          <div className="site-container site-centered-stack">
            <h2 className="site-section-title" data-testid="public-site-footer-social-title">
              {copy.footerSocialTitle}
            </h2>
            <div className="site-social-links" data-testid="public-site-footer-social-links">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`site-social-link is-${link.id}`}
                  aria-label={link.label}
                  title={link.label}
                  data-testid={`public-site-footer-social-link-${link.id}`}
                >
                  <span className="site-social-icon" dangerouslySetInnerHTML={{ __html: iconMarkup[link.id] }} />
                  <span className="site-visually-hidden">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showPartnersSection ? (
        <section className="site-footer-partners" data-testid="public-site-footer-partners">
          <div className="site-container">
            <h2 className="site-section-title" data-testid="public-site-footer-partners-title">
              {copy.footerPartnersTitle}
            </h2>
          </div>
          <div className="site-partners-marquee" data-testid="public-site-footer-partners-marquee">
            <div className="site-partners-track">
              {[...partners, ...partners].map((partner, index) => (
                <a
                  key={`${partner.id}-${index}`}
                  href={partner.link}
                  target="_blank"
                  rel="noreferrer"
                  className="site-partner-link"
                  data-testid={`public-site-footer-partner-${partner.id}-${index}`}
                >
                  <Image src={partner.logo} alt={partner.name} width={200} height={72} sizes="200px" quality={100} className="site-partner-logo" />
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="site-footer-bottom" data-testid="public-site-footer-bottom">
        <div className="site-container">
          <div className="site-footer-bottom-links" data-testid="public-site-footer-bottom-links">
            {footerLinks.map((link) => (
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