"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type GuestSessionValue = {
  guestName: string | null;
  setGuestName: (name: string | null) => void;
  clearChoices: (() => Promise<void>) | null;
  setClearChoices: (handler: (() => Promise<void>) | null) => void;
};

const GuestSessionContext = createContext<GuestSessionValue | null>(null);

/** Shares the identified guest with the header so their name can reset the flow. */
export function GuestSessionProvider({ children }: { children: React.ReactNode }) {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [clearChoices, setClearChoicesState] = useState<
    (() => Promise<void>) | null
  >(null);

  const setClearChoices = useCallback((handler: (() => Promise<void>) | null) => {
    setClearChoicesState(() => handler);
  }, []);

  const value = useMemo(
    () => ({ guestName, setGuestName, clearChoices, setClearChoices }),
    [guestName, clearChoices, setClearChoices],
  );

  return (
    <GuestSessionContext.Provider value={value}>
      {children}
    </GuestSessionContext.Provider>
  );
}

/** Returns the guest session controls used by the header and invitation flow. */
export function useGuestSession() {
  const value = useContext(GuestSessionContext);
  if (!value) {
    throw new Error("useGuestSession must be used within GuestSessionProvider");
  }
  return value;
}

/** Safe access when the header is also rendered on admin pages without a provider. */
export function useOptionalGuestSession() {
  return useContext(GuestSessionContext);
}
