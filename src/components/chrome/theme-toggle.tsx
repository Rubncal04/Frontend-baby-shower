"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

const OPTIONS = [
  { id: "light", icon: Sun, labelKey: "themeLight" },
  { id: "dark", icon: Moon, labelKey: "themeDark" },
  { id: "system", icon: Monitor, labelKey: "themeSystem" },
] as const;

/** Lets the guest pick light, dark, or system color theme. */
export function ThemeToggle() {
  const t = useTranslations("chrome");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-11 w-[8.5rem]" aria-hidden />;
  }

  return (
    <div
      role="group"
      aria-label={t("theme")}
      className="flex h-11 rounded-[var(--radius-control)] border border-border bg-surface p-1"
    >
      {OPTIONS.map(({ id, icon: Icon, labelKey }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={active}
            aria-label={t(labelKey)}
            className={`flex min-h-9 min-w-9 items-center justify-center rounded-[calc(var(--radius-control)-4px)] px-2 transition-colors duration-200 ${
              active
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
