import type { Metadata } from "next";
import { Space_Grotesk, Spectral } from "next/font/google";

import { getRequestLocale } from "@/lib/i18n/request";

import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Spectral({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Greeters Next Migration",
  description: "Squelette Next.js initial pour la migration Greeters vers App Router.",
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
        className={`${headingFont.variable} ${bodyFont.variable} app-shell`}
        data-testid="app-root-layout"
      >
        {children}
      </body>
    </html>
  );
}
