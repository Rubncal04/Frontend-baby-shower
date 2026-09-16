"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GiftIcon } from "@/components/invite/gift-icon";
import {
  adminLogin,
  adminReleaseGift,
  fetchAdminGifts,
  fetchAdminGuests,
  fetchAdminOverview,
  pingHealth,
  updateAdminAttendance,
} from "@/lib/api";
import { withMinimumDelay } from "@/lib/format";
import { getAdminToken, setAdminToken } from "@/lib/storage";
import { isGiftNameId } from "@/lib/gift-names";
import { ApiError } from "@/lib/types";
import type {
  AdminGift,
  AdminGuest,
  AdminGuestGroup,
  AdminOverview,
  AttendanceStatus,
} from "@/lib/types";

type Tab = "overview" | "guests" | "gifts";

/** Host dashboard: login, overview counters, guest checklist, and gifts. */
export function AdminApp() {
  const t = useTranslations("admin");
  const giftsT = useTranslations("gifts");
  const statusT = useTranslations("status");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "overview";

  const [tokenReady, setTokenReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [groups, setGroups] = useState<AdminGuestGroup[]>([]);
  const [gifts, setGifts] = useState<AdminGift[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingGift, setPendingGift] = useState<AdminGift | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [nextOverview, nextGuests, nextGifts] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminGuests(),
        fetchAdminGifts(),
      ]);
      setOverview(nextOverview);
      setGroups(nextGuests.groups);
      setGifts(nextGifts.gifts);
      setAuthed(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAdminToken(null);
        setAuthed(false);
        return;
      }
      setLoadError(error instanceof ApiError ? error.message : statusT("error"));
    }
  }, []);

  useEffect(() => {
    const token = getAdminToken();
    setTokenReady(true);
    setAuthed(Boolean(token));
    if (!token) return;
    void pingHealth().then(loadAll);
  }, [loadAll]);

  /** Persists the selected dashboard tab in the URL. */
  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  /** Signs the host in and stores the JWT. */
  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const result = await withMinimumDelay(adminLogin(email.trim(), password));
      setAdminToken(result.token);
      setPassword("");
      await loadAll();
    } catch (error) {
      setLoginError(
        error instanceof ApiError ? error.message : statusT("error"),
      );
    } finally {
      setLoggingIn(false);
    }
  }

  /** Updates a guest RSVP from the checklist. */
  async function onAttendance(guest: AdminGuest, attending: AttendanceStatus) {
    const saved = guest.attending;
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        members: group.members.map((member) =>
          member.id === guest.id ? { ...member, attending } : member,
        ),
      })),
    );
    try {
      await updateAdminAttendance(guest.id, attending);
      const nextOverview = await fetchAdminOverview();
      setOverview(nextOverview);
    } catch {
      setGroups((current) =>
        current.map((group) => ({
          ...group,
          members: group.members.map((member) =>
            member.id === guest.id ? { ...member, attending: saved } : member,
          ),
        })),
      );
    }
  }

  /** Releases a gift after the host confirms. */
  async function onRelease() {
    if (!pendingGift) return;
    setBusy(true);
    try {
      await withMinimumDelay(adminReleaseGift(pendingGift.id));
      setPendingGift(null);
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  const family = useMemo(
    () => groups.filter((group) => group.type === "familia"),
    [groups],
  );
  const friends = useMemo(
    () => groups.filter((group) => group.type === "amigos"),
    [groups],
  );
  const allGuests = useMemo(
    () => groups.flatMap((group) => group.members),
    [groups],
  );
  const declinedGuests = useMemo(
    () => allGuests.filter((guest) => guest.attending === false),
    [allGuests],
  );
  const attendingGuests = useMemo(
    () => allGuests.filter((guest) => guest.attending === true),
    [allGuests],
  );
  const pendingGuests = useMemo(
    () => allGuests.filter((guest) => guest.attending === null),
    [allGuests],
  );
  const reservedGifts = useMemo(
    () => gifts.filter((gift) => gift.reserved),
    [gifts],
  );

  if (!tokenReady) {
    return <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface paper-shadow" />;
  }

  if (!authed) {
    return (
      <section className="mx-auto max-w-md rounded-[var(--radius-card)] bg-surface p-6 paper-shadow sm:p-8">
        <h1 className="font-display text-3xl">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("loginLead")}</p>
        <form className="mt-6 space-y-4" onSubmit={onLogin}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              autoFocus
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-background px-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-background px-3 text-base"
            />
          </div>
          {loginError ? (
            <p role="alert" className="text-sm text-danger">
              {loginError}
            </p>
          ) : null}
          <Button type="submit" loading={loggingIn} className="w-full">
            {t("submit")}
          </Button>
        </form>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setAdminToken(null);
            setAuthed(false);
          }}
        >
          {t("logout")}
        </Button>
      </div>

      <div
        role="tablist"
        aria-label={t("title")}
        className="flex flex-wrap gap-1 rounded-[var(--radius-control)] border border-border bg-surface p-1"
      >
        {(["overview", "guests", "gifts"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 rounded-[calc(var(--radius-control)-4px)] px-4 text-sm font-medium ${
              tab === id
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-foreground"
            }`}
          >
            {id === "overview"
              ? t("overview")
              : id === "guests"
                ? t("guests")
                : t("giftsTab")}
          </button>
        ))}
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : null}

      {tab === "overview" && overview ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("totalGuests")} value={overview.guests.total} />
            <Stat label={t("attending")} value={overview.guests.attending} />
            <Stat label={t("notAttending")} value={overview.guests.notAttending} />
            <Stat label={t("pending")} value={overview.guests.pending} />
            <Stat label={t("giftsReserved")} value={overview.gifts.reserved} />
            <Stat label={t("giftsAvailable")} value={overview.gifts.available} />
            <Stat label={t("hiddenReserved")} value={overview.gifts.hiddenReserved} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PeopleList
              title={t("declinedTitle")}
              empty={t("emptyDeclined")}
              people={declinedGuests}
            />
            <ReservedGiftList gifts={reservedGifts} empty={t("emptyReserved")} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PeopleList
              title={t("attendingTitle")}
              empty={t("emptyAttending")}
              people={attendingGuests}
            />
            <PeopleList
              title={t("pendingTitle")}
              empty={t("emptyPending")}
              people={pendingGuests}
            />
          </div>
        </div>
      ) : null}

      {tab === "guests" ? (
        <div className="space-y-8">
          <GuestGroups
            title={t("family")}
            groups={family}
            onAttendance={onAttendance}
          />
          <GuestGroups
            title={t("friends")}
            groups={friends}
            onAttendance={onAttendance}
          />
        </div>
      ) : null}

      {tab === "gifts" ? (
        <ul className="space-y-2">
          {gifts.map((gift) => {
            const name = isGiftNameId(gift.id)
              ? giftsT(`names.${gift.id}`)
              : gift.name;
            return (
              <li
                key={gift.id}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] border border-border bg-surface px-4 py-3"
              >
                <GiftIcon name={gift.icon} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted">
                    {gift.tier === "costoso"
                      ? t("tierCostoso")
                      : gift.tier === "economico"
                        ? t("tierEconomico")
                        : t("tierOculto")}
                    {gift.reserved && gift.reservedByName
                      ? ` · ${t("takenBy", { name: gift.reservedByName })}`
                      : gift.reserved && gift.preReserved
                        ? ` · ${t("preReserved")}`
                        : ` · ${t("available")}`}
                  </p>
                </div>
                {gift.reserved && !gift.preReserved ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPendingGift(gift)}
                  >
                    {t("release")}
                  </Button>
                ) : gift.preReserved ? (
                  <span className="text-xs text-muted">{t("cannotRelease")}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingGift)}
        title={t("confirmReleaseTitle", {
          name: pendingGift
            ? isGiftNameId(pendingGift.id)
              ? giftsT(`names.${pendingGift.id}`)
              : pendingGift.name
            : "",
        })}
        body={t("confirmReleaseBody")}
        confirmLabel={t("release")}
        cancelLabel={giftsT("cancel")}
        loading={busy}
        onClose={() => setPendingGift(null)}
        onConfirm={onRelease}
      />
    </div>
  );
}

type StatProps = { label: string; value: number };

/** Compact metric tile for the overview grid. */
function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface p-5 paper-shadow">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl tabular">{value}</p>
    </div>
  );
}

type PeopleListProps = {
  title: string;
  empty: string;
  people: AdminGuest[];
};

/** Named list of guests filtered by attendance. */
function PeopleList({ title, empty, people }: PeopleListProps) {
  const t = useTranslations("admin");

  return (
    <section className="rounded-[var(--radius-card)] bg-surface p-5 paper-shadow">
      <h2 className="font-display text-2xl">{title}</h2>
      {people.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {people.map((person) => (
            <li key={person.id} className="py-3">
              <p className="text-sm font-medium" translate="no">
                {person.name}
              </p>
              <p className="text-xs text-muted">
                <span translate="no">{person.groupName}</span>
                {" · "}
                <span translate="no">{person.phone ?? t("noPhone")}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ReservedGiftListProps = {
  gifts: AdminGift[];
  empty: string;
};

/** Named list of reserved gifts and who took them. */
function ReservedGiftList({ gifts, empty }: ReservedGiftListProps) {
  const t = useTranslations("admin");
  const giftsT = useTranslations("gifts");

  return (
    <section className="rounded-[var(--radius-card)] bg-surface p-5 paper-shadow">
      <h2 className="font-display text-2xl">{t("reservedTitle")}</h2>
      {gifts.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {gifts.map((gift) => {
            const name = isGiftNameId(gift.id)
              ? giftsT(`names.${gift.id}`)
              : gift.name;
            return (
              <li key={gift.id} className="flex items-start gap-3 py-3">
                <GiftIcon name={gift.icon} className="mt-0.5 size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted">
                    {gift.reservedByName
                      ? t("takenBy", { name: gift.reservedByName })
                      : t("preReserved")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GuestGroupsProps = {
  title: string;
  groups: AdminGuestGroup[];
  onAttendance: (guest: AdminGuest, attending: AttendanceStatus) => void;
};

/** Renders grouped guest checklists with attendance controls. */
function GuestGroups({ title, groups, onAttendance }: GuestGroupsProps) {
  const t = useTranslations("admin");

  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div
            key={group.groupKey}
            className="rounded-[var(--radius-card)] border border-border bg-surface p-4"
          >
            <h3 className="text-sm font-medium text-muted">{group.groupName}</h3>
            <ul className="mt-3 divide-y divide-border">
              {group.members.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium" translate="no">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted" translate="no">
                      {member.phone ?? t("noPhone")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <AttendanceChip
                      label={t("markYes")}
                      active={member.attending === true}
                      onClick={() => onAttendance(member, true)}
                    />
                    <AttendanceChip
                      label={t("markNo")}
                      active={member.attending === false}
                      onClick={() => onAttendance(member, false)}
                    />
                    <AttendanceChip
                      label={t("markPending")}
                      active={member.attending === null}
                      onClick={() => onAttendance(member, null)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

type AttendanceChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

/** Compact attendance toggle used in the admin checklist. */
function AttendanceChip({ label, active, onClick }: AttendanceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-[var(--radius-control)] px-3 text-xs font-medium ${
        active
          ? "bg-accent text-accent-fg"
          : "border border-border text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
