export const THEME_COOKIE = "theme";

export type ThemeChoice = "light" | "dark" | "system";

/** Reads a stored theme value, falling back to system. */
export function parseTheme(value: string | undefined): ThemeChoice {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

/** Class applied to <html> for an explicit light or dark cookie. */
export function themeClassFromCookie(value: string | undefined): "light" | "dark" | "" {
  if (value === "light" || value === "dark") return value;
  return "";
}
