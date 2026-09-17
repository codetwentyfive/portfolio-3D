import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Archivo, Barlow_Condensed } from "next/font/google";
import { routing } from "@/src/i18n/routing";
import { AudioProvider } from "@/context/AudioContext";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";
import SiteFooter from "@/components/SiteFooter";
import GlassFilters from "@/components/GlassFilters";
import "../globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout(
  props: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const { locale } = await props.params;

  const { children } = props;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${archivo.variable} ${barlow.variable}`}>
      <body>
        <GlassFilters />
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
