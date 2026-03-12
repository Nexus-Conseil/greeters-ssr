import type { Metadata } from "next";
import { Pacifico } from "next/font/google";
import Script from "next/script";

import { getRequestLocale } from "@/lib/i18n/request";

import "./globals.css";
import "./public-site.css";

const MULTILIPI_ALTERNATES = [
  { href: "https://greeters.nexus-conseil.ch/", hreflang: "x-default" },
  { href: "https://nl.greeters.nexus-conseil.ch/", hreflang: "nl" },
  { href: "https://en.greeters.nexus-conseil.ch/", hreflang: "en" },
  { href: "https://de.greeters.nexus-conseil.ch/", hreflang: "de" },
  { href: "https://it.greeters.nexus-conseil.ch/", hreflang: "it" },
  { href: "https://ja.greeters.nexus-conseil.ch/", hreflang: "ja" },
  { href: "https://pt-pt.greeters.nexus-conseil.ch/", hreflang: "pt-pt" },
  { href: "https://zh-hans.greeters.nexus-conseil.ch/", hreflang: "zh-hans" },
  { href: "https://es.greeters.nexus-conseil.ch/", hreflang: "es" },
];

const scriptFont = Pacifico({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Paris Greeters — Balades gratuites avec un local",
  description: "Découvrez Paris autrement avec les Greeters : des balades gratuites, humaines et locales au cœur de la ville.",
  metadataBase: new URL("https://greeters.paris"),
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <head>
        {MULTILIPI_ALTERNATES.map((alternate) => (
          <link key={alternate.hreflang} href={alternate.href} hrefLang={alternate.hreflang} rel="alternate" />
        ))}
      </head>
      <body
        className={`${scriptFont.variable} app-shell`}
        data-testid="app-root-layout"
      >
        {children}
        <Script
          src="https://script-cdn.multilipi.com/static/JS/page_translations.js"
          strategy="lazyOnload"
          crossOrigin="anonymous"
          data-pos-x="50"
          data-pos-y="50"
          {...{ mode: "auto", "multilipi-key": "726562fe-f615-404a-b985-a73e661ee3dc" }}
        />
      </body>
    </html>
  );
}
