import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono, Great_Vibes } from "next/font/google";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/chrome/providers";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type LocaleParams = { locale: string };

/** Builds locale-aware metadata for the invitation. */
export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });
  const name = "Nohan";
  return {
    title: t("title", { name }),
    description: t("description", { name }),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#13253E" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** Pre-renders every supported locale. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Locale shell with fonts, theme, and translated messages. */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${greatVibes.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
