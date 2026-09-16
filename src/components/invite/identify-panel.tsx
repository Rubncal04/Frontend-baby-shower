"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicMember } from "@/lib/types";

type IdentifyPanelProps = {
  hint: string;
  error: string | null;
  loading: boolean;
  members: PublicMember[] | null;
  groupName: string | null;
  onIdentify: (phone: string) => Promise<void>;
  onSelect: (guestId: string) => Promise<void>;
  onReset: () => void;
};

/** Phone lookup plus in-group name picker for the invitation session. */
export function IdentifyPanel({
  hint,
  error,
  loading,
  members,
  groupName,
  onIdentify,
  onSelect,
  onReset,
}: IdentifyPanelProps) {
  const t = useTranslations("identify");
  const [phone, setPhone] = useState("");
  const [guestId, setGuestId] = useState("");
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    /** Focuses the phone field on desktop so Enter submits quickly. */
    function focusPhoneOnDesktop() {
      if (members) return;
      if (window.matchMedia("(pointer: fine) and (min-width: 768px)").matches) {
        document.getElementById("phone")?.focus();
      }
    }

    focusPhoneOnDesktop();
  }, [members]);

  /** Submits the phone lookup when this is the only control, or the last step. */
  async function handleIdentify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onIdentify(phone);
  }

  /** Opens a session for the chosen person in the matched group. */
  async function handleSelect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guestId) return;
    setPicking(true);
    try {
      await onSelect(guestId);
    } finally {
      setPicking(false);
    }
  }

  if (members) {
    return (
      <section className="rounded-[var(--radius-card)] bg-surface p-6 paper-shadow sm:p-8">
        <h2 className="font-display text-3xl">{t("pickTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("pickLead")}</p>
        {groupName ? (
          <p className="mt-1 text-sm text-muted">
            {t("groupLabel", { groupName })}
          </p>
        ) : null}
        <form className="mt-6 space-y-4" onSubmit={handleSelect}>
          <fieldset className="space-y-2">
            <legend className="sr-only">{t("pickTitle")}</legend>
            {members.map((member) => (
              <label
                key={member.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-border px-4 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus has-[:checked]:border-accent has-[:checked]:bg-watercolor-50 dark:has-[:checked]:bg-navy-800"
              >
                <input
                  type="radio"
                  name="guestId"
                  value={member.id}
                  checked={guestId === member.id}
                  onChange={() => setGuestId(member.id)}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className="text-sm font-medium" translate="no">
                  {member.name}
                </span>
              </label>
            ))}
          </fieldset>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={picking} disabled={!guestId}>
              {t("continue")}
            </Button>
            <Button type="button" variant="ghost" onClick={onReset}>
              {t("back")}
            </Button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-card)] bg-surface p-6 paper-shadow sm:p-8">
      <h2 className="font-display text-3xl">{t("title")}</h2>
      <p className="mt-2 text-sm text-muted">{t("lead")}</p>
      <form className="mt-6 space-y-4" onSubmit={handleIdentify}>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
            {t("phoneLabel")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            spellCheck={false}
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-background px-3 text-base text-foreground placeholder:text-muted"
          />
        </div>
        <p className="text-sm text-muted">{hint}</p>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading}>
          {t("submit")}
        </Button>
      </form>
    </section>
  );
}
