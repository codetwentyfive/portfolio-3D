import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Manrope, Syne } from "next/font/google";
import { routing } from "@/src/i18n/routing";
import { AudioProvider } from "@/context/AudioContext";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";
import SiteFooter from "@/components/SiteFooter";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL("https://chingis.dev"),
  authors: [{ name: "Chingis Zwecker E.", url: "https://chingis.dev" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicon-180x180.png", sizes: "180x180" }],
  },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${manrope.variable} ${syne.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AudioProvider>
            <main className="min-h-screen">
              <Navbar />
              {children}
              <AudioPlayer />
              <SiteFooter />
            </main>
          </AudioProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
