"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { THEME_COOKIE, parseTheme, type ThemeChoice } from "./theme";

type ThemeContextValue = {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Writes the theme class, color-scheme, cookie, and localStorage. */
function applyTheme(theme: ThemeChoice) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  localStorage.setItem(THEME_COOKIE, theme);
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

type ThemeProviderProps = {
  initialTheme: ThemeChoice;
  children: React.ReactNode;
};

/** Client theme state without injecting a <script> into the React tree. */
export function ThemeProvider({ initialTheme, children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeChoice>(initialTheme);

  useEffect(() => {
    const stored = parseTheme(localStorage.getItem(THEME_COOKIE) ?? undefined);
    setThemeState(stored);
    applyTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    /** Re-applies system theme when the OS preference changes. */
    function onPreferenceChange() {
      if (parseTheme(localStorage.getItem(THEME_COOKIE) ?? undefined) === "system") {
        applyTheme("system");
      }
    }

    media.addEventListener("change", onPreferenceChange);
    return () => media.removeEventListener("change", onPreferenceChange);
  }, []);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Accesses the current color theme and setter. */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
