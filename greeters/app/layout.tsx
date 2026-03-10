import type { Metadata } from "next";
import { Pacifico } from "next/font/google";

import { getRequestLocale } from "@/lib/i18n/request";

import "./globals.css";
import "./public-site.css";

const scriptFont = Pacifico({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Paris Greeters — Balades gratuites avec un local",
  description: "Découvrez Paris autrement avec les Greeters : des balades gratuites, humaines et locales au cœur de la ville.",
  metadataBase: new URL("https://greeters.paris"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body
        className={`${scriptFont.variable} app-shell`}
        data-testid="app-root-layout"
      >
        {children}
      </body>
    </html>
  );
}
