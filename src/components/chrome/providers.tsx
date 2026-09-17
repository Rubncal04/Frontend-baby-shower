"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import type { AppLocale } from "@/i18n/routing";
import { ThemeProvider } from "./theme-provider";
import type { ThemeChoice } from "./theme";

type ProvidersProps = {
  locale: AppLocale;
  messages: ComponentProps<typeof NextIntlClientProvider>["messages"];
  theme: ThemeChoice;
  children: React.ReactNode;
};

/** Wraps the app with locale messages and light/dark theme. */
export function Providers({ locale, messages, theme, children }: ProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="America/Bogota"
    >
      <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
    </NextIntlClientProvider>
  );
}
