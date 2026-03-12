import Image from "next/image";

import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedFooterLinks, getPublicCopy } from "@/lib/i18n/site-copy";
import { PARTNERS, SOCIAL_LINKS } from "@/lib/public-site-data";

import { FooterClient } from "./FooterClient";

export const Footer = async () => {
  const locale = await getRequestLocale();
  const copy = getPublicCopy(locale);
  const footerLinks = getLocalizedFooterLinks(locale);

  return <FooterClient copy={copy} footerLinks={footerLinks} partners={PARTNERS} socialLinks={SOCIAL_LINKS} />;
};