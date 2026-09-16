"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Switches the active locale while keeping the current path. */
export function LocaleSwitcher() {
  const t = useTranslations("chrome");
  const localeLabel = useTranslations("locales");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-11 w-28" aria-hidden />;
  }

  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <span className="sr-only">{t("language")}</span>
      <select
        autoComplete="off"
        suppressHydrationWarning
        value={locale}
        onChange={(event) => {
          router.replace(pathname, { locale: event.target.value as AppLocale });
        }}
        className="min-h-11 min-w-28 appearance-none rounded-[var(--radius-control)] border border-border bg-surface px-3 text-base text-foreground md:text-sm"
        style={{ backgroundColor: "var(--surface)", color: "var(--foreground)" }}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {localeLabel(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
