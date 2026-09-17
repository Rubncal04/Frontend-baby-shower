"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AdminGroup, AdminGuest, GuestType, GuestWritePayload } from "@/lib/types";

const FIELD =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-background px-3 text-base";

const NEW_GROUP = "__new__";

type GuestFormProps = {
  groups: AdminGroup[];
  initial?: AdminGuest | null;
  prefill?: { type: GuestType; groupKey: string } | null;
  busy: boolean;
  error: string | null;
  embedded?: boolean;
  onSubmit: (payload: GuestWritePayload) => Promise<void>;
  onCancel: () => void;
};

/** Create or edit form for an admin-managed guest. */
export function GuestForm({
  groups,
  initial,
  prefill,
  busy,
  error,
  embedded,
  onSubmit,
  onCancel,
}: GuestFormProps) {
  const t = useTranslations("admin");
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [type, setType] = useState<GuestType>(initial?.type ?? prefill?.type ?? "familia");
  const [groupChoice, setGroupChoice] = useState(
    initial?.groupKey ?? prefill?.groupKey ?? NEW_GROUP,
  );
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!embedded) return;
    formRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    formRef.current?.querySelector("input")?.focus();
  }, [embedded]);

  const groupsOfType = useMemo(
    () => groups.filter((group) => group.type === type),
    [groups, type],
  );

  const selectedExisting =
    groupChoice !== NEW_GROUP &&
    groupsOfType.some((group) => group.groupKey === groupChoice);

  /** Submits a create or update payload matching the admin guest API. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedGroupName = groupName.trim();
    const payload: GuestWritePayload = {
      name: trimmedName,
      type,
      phone: trimmedPhone ? trimmedPhone : null,
    };

    if (selectedExisting) {
      payload.groupKey = groupChoice;
    } else {
      payload.groupName = trimmedGroupName;
    }

    await onSubmit(payload);
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
        {initial ? t("editGuest") : t("addGuest")}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-name`} className="mb-1.5 block text-sm font-medium">
            {t("guestName")}
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("guestNamePlaceholder")}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-phone`} className="mb-1.5 block text-sm font-medium">
            {t("phone")}
          </label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={t("guestPhonePlaceholder")}
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
            onChange={(event) => {
              const next = event.target.value as GuestType;
              setType(next);
              setGroupChoice(NEW_GROUP);
            }}
            className={FIELD}
          >
            <option value="familia">{t("family")}</option>
            <option value="amigos">{t("friends")}</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-group`} className="mb-1.5 block text-sm font-medium">
            {t("guestGroup")}
          </label>
          <select
            id={`${formId}-group`}
            name="group"
            value={selectedExisting ? groupChoice : NEW_GROUP}
            onChange={(event) => setGroupChoice(event.target.value)}
            className={FIELD}
          >
            <option value={NEW_GROUP}>{t("groupNew")}</option>
            {groupsOfType.map((group) => (
              <option key={group.groupKey} value={group.groupKey}>
                {group.groupName}
              </option>
            ))}
          </select>
        </div>
        {!selectedExisting ? (
          <div className="sm:col-span-2">
            <label
              htmlFor={`${formId}-group-name`}
              className="mb-1.5 block text-sm font-medium"
            >
              {t("groupName")}
            </label>
            <input
              id={`${formId}-group-name`}
              name="groupName"
              required
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder={t("groupNamePlaceholder")}
              className={FIELD}
            />
            <p className="mt-1 text-xs text-muted">{t("groupNameHint")}</p>
          </div>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" loading={busy}>
          {t("saveGuest")}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("cancelGuest")}
        </Button>
      </div>
    </form>
  );
}
