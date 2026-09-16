"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { useOptionalGuestSession } from "./guest-session";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Link } from "@/i18n/navigation";

/** Top bar with language, theme, and a path back to the invitation. */
export function SiteHeader({ admin }: { admin?: boolean }) {
  const t = useTranslations("admin");
  const brand = useTranslations("brand");
  const studio = useTranslations("studio");
  const gifts = useTranslations("gifts");
  const session = useOptionalGuestSession();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  /** Asks before dropping the identified guest, RSVP, and reserved gift. */
  async function confirmClearChoices() {
    if (!session?.clearChoices) return;
    setClearing(true);
    try {
      await session.clearChoices();
      setConfirmOpen(false);
    } finally {
      setClearing(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-foreground"
          translate="no"
        >
          {brand("babyName")}
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          {admin ? (
            <Link
              href="/"
              className="hidden min-h-11 items-center rounded-[var(--radius-control)] px-3 text-sm text-muted hover:text-foreground sm:flex"
            >
              {t("backHome")}
            </Link>
          ) : (
            <Link
              href="/admin"
              className="hidden min-h-11 items-center rounded-[var(--radius-control)] px-3 text-sm text-muted hover:text-foreground sm:flex"
            >
              {t("headerLink")}
            </Link>
          )}
          {session?.guestName ? (
            <button
              type="button"
              translate="no"
              onClick={() => setConfirmOpen(true)}
              aria-label={studio("clearChoicesHint", { name: session.guestName })}
              className="max-w-[9.5rem] truncate rounded-[var(--radius-control)] px-3 min-h-11 text-sm font-medium text-foreground hover:bg-surface-2 sm:max-w-[14rem]"
            >
              {session.guestName}
            </button>
          ) : null}
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title={studio("clearChoicesTitle")}
        body={studio("clearChoicesBody")}
        confirmLabel={studio("clearChoicesAction")}
        cancelLabel={gifts("cancel")}
        loading={clearing}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmClearChoices}
      />
    </header>
  );
}
