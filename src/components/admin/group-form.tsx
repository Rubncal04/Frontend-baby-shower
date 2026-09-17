"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AdminGroup, GroupWritePayload, GuestType } from "@/lib/types";

const FIELD =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-background px-3 text-base";

type GroupFormProps = {
  initial?: AdminGroup | null;
  busy: boolean;
  error: string | null;
  embedded?: boolean;
  onSubmit: (payload: GroupWritePayload) => Promise<void>;
  onCancel: () => void;
};

/** Create or edit form for an admin-managed guest group. */
export function GroupForm({
  initial,
  busy,
  error,
  embedded,
  onSubmit,
  onCancel,
}: GroupFormProps) {
  const t = useTranslations("admin");
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(initial?.groupName ?? "");
  const [type, setType] = useState<GuestType>(initial?.type ?? "familia");

  useEffect(() => {
    if (!embedded) return;
    formRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    formRef.current?.querySelector("input")?.focus();
  }, [embedded]);

  /** Submits a create or update payload matching the admin group API. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: name.trim(),
      type,
    });
  }

  return (
    <form
      ref={formRef}
      className={
        embedded
          ? "w-full"
          : "rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5"
      }
      onSubmit={handleSubmit}
    >
      <h3 className={embedded ? "text-sm font-medium" : "font-display text-2xl"}>
        {initial ? t("editGroup") : t("addGroup")}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-name`} className="mb-1.5 block text-sm font-medium">
            {t("groupName")}
          </label>
          <input
            id={`${formId}-name`}
            name="groupName"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("groupNamePlaceholder")}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-type`} className="mb-1.5 block text-sm font-medium">
            {t("guestType")}
          </label>
          <select
            id={`${formId}-type`}
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as GuestType)}
            className={FIELD}
          >
            <option value="familia">{t("family")}</option>
            <option value="amigos">{t("friends")}</option>
          </select>
        </div>
      </div>
      {initial && type !== initial.type ? (
        <p className="mt-3 text-xs text-muted">{t("groupTypeHint")}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" loading={busy}>
          {t("saveGroup")}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("cancelGuest")}
        </Button>
      </div>
    </form>
  );
}
