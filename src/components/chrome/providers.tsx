"use client";

import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import type { ComponentProps } from "react";
import type { AppLocale } from "@/i18n/routing";

type ProvidersProps = {
  locale: AppLocale;
  messages: ComponentProps<typeof NextIntlClientProvider>["messages"];
  children: React.ReactNode;
};

/** Wraps the app with locale messages and light/dark theme. */
export function Providers({ locale, messages, children }: ProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="America/Bogota"
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
