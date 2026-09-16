const GUEST_TOKEN_KEY = "nohan-guest-token";
const ADMIN_TOKEN_KEY = "nohan-admin-token";

/** Reads a token from localStorage, returning null on the server or when missing. */
function readToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

/** Persists or clears a token in localStorage. */
function writeToken(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
}

/** Returns the current guest session token. */
export function getGuestToken(): string | null {
  return readToken(GUEST_TOKEN_KEY);
}

/** Stores or clears the guest session token. */
export function setGuestToken(token: string | null): void {
  writeToken(GUEST_TOKEN_KEY, token);
}

/** Returns the current admin JWT. */
export function getAdminToken(): string | null {
  return readToken(ADMIN_TOKEN_KEY);
}

/** Stores or clears the admin JWT. */
export function setAdminToken(token: string | null): void {
  writeToken(ADMIN_TOKEN_KEY, token);
}
