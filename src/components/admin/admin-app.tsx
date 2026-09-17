"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GiftIcon } from "@/components/invite/gift-icon";
import { GroupForm } from "@/components/admin/group-form";
import { GuestForm } from "@/components/admin/guest-form";
import {
  adminLogin,
  adminReleaseGift,
  createAdminGroup,
  createAdminGuest,
  deleteAdminGroup,
  deleteAdminGuest,
  fetchAdminGifts,
  fetchAdminGroups,
  fetchAdminGuests,
  fetchAdminOverview,
  pingHealth,
  updateAdminAttendance,
  updateAdminGroup,
  updateAdminGuest,
} from "@/lib/api";
import { withMinimumDelay } from "@/lib/format";
import { getAdminToken, setAdminToken } from "@/lib/storage";
import { isGiftNameId } from "@/lib/gift-names";
import { ApiError } from "@/lib/types";
import type {
  AdminGift,
  AdminGroup,
  AdminGuest,
  AdminGuestGroup,
  AdminOverview,
  AttendanceStatus,
  GroupWritePayload,
  GuestType,
  GuestWritePayload,
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
  const [catalogGroups, setCatalogGroups] = useState<AdminGroup[]>([]);
  const [gifts, setGifts] = useState<AdminGift[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingGift, setPendingGift] = useState<AdminGift | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminGuest | null>(null);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<AdminGuestGroup | null>(null);
  const [guestForm, setGuestForm] = useState<AdminGuest | "new" | null>(null);
  const [guestPrefill, setGuestPrefill] = useState<{
    type: GuestType;
    groupKey: string;
  } | null>(null);
  const [groupForm, setGroupForm] = useState<AdminGroup | "new" | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [nextOverview, nextGuests, nextCatalog, nextGifts] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminGuests(),
        fetchAdminGroups(),
        fetchAdminGifts(),
      ]);
      setOverview(nextOverview);
      setGroups(nextGuests.groups);
      setCatalogGroups(nextCatalog.groups);
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

  /** Creates or updates a guest, then refreshes the dashboard lists. */
  async function onSaveGuest(payload: GuestWritePayload) {
    setFormBusy(true);
    setFormError(null);
    try {
      if (guestForm && guestForm !== "new") {
        await withMinimumDelay(updateAdminGuest(guestForm.id, payload));
      } else {
        await withMinimumDelay(createAdminGuest(payload));
      }
      setGuestForm(null);
      setGuestPrefill(null);
      await loadAll();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : statusT("error"));
    } finally {
      setFormBusy(false);
    }
  }

  /** Creates or updates a guest group from the admin group API. */
  async function onSaveGroup(payload: GroupWritePayload) {
    setFormBusy(true);
    setFormError(null);
    try {
      if (groupForm && groupForm !== "new") {
        await withMinimumDelay(
          updateAdminGroup(groupForm.groupKey, {
            name: payload.name,
            type: payload.type,
          }),
        );
      } else {
        await withMinimumDelay(createAdminGroup(payload));
      }
      setGroupForm(null);
      await loadAll();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : statusT("error"));
    } finally {
      setFormBusy(false);
    }
  }

  /** Deletes a guest after the host confirms. */
  async function onDeleteGuest() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await withMinimumDelay(deleteAdminGuest(pendingDelete.id));
      setPendingDelete(null);
      if (guestForm !== "new" && guestForm?.id === pendingDelete.id) {
        setGuestForm(null);
      }
      await loadAll();
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : statusT("error"));
    } finally {
      setBusy(false);
    }
  }

  /** Deletes an empty group after the host confirms. */
  async function onDeleteGroup() {
    if (!pendingDeleteGroup) return;
    setBusy(true);
    try {
      await withMinimumDelay(deleteAdminGroup(pendingDeleteGroup.groupKey));
      setPendingDeleteGroup(null);
      if (groupForm !== "new" && groupForm?.groupKey === pendingDeleteGroup.groupKey) {
        setGroupForm(null);
      }
      await loadAll();
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : statusT("error"));
    } finally {
      setBusy(false);
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
          {guestForm === "new" && !guestPrefill ? (
            <GuestForm
              key="new"
              groups={catalogGroups}
              busy={formBusy}
              error={formError}
              onSubmit={onSaveGuest}
              onCancel={() => {
                setGuestForm(null);
                setGuestPrefill(null);
                setFormError(null);
              }}
            />
          ) : groupForm === "new" ? (
            <GroupForm
              key="new-group"
              busy={formBusy}
              error={formError}
              onSubmit={onSaveGroup}
              onCancel={() => {
                setGroupForm(null);
                setFormError(null);
              }}
            />
          ) : guestForm || groupForm ? null : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  setGroupForm(null);
                  setGuestPrefill(null);
                  setFormError(null);
                  setGuestForm("new");
                }}
              >
                {t("addGuest")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setGuestForm(null);
                  setGuestPrefill(null);
                  setFormError(null);
                  setGroupForm("new");
                }}
              >
                {t("addGroup")}
              </Button>
            </div>
          )}
          <GuestGroups
            title={t("family")}
            groups={family}
            catalogGroups={catalogGroups}
            editingGuest={guestForm === "new" ? null : guestForm}
            editingGroup={groupForm === "new" ? null : groupForm}
            creatingInGroup={guestForm === "new" ? guestPrefill : null}
            formBusy={formBusy}
            formError={formError}
            onAttendance={onAttendance}
            onEdit={(guest) => {
              setGroupForm(null);
              setGuestPrefill(null);
              setFormError(null);
              setGuestForm(guest);
            }}
            onSave={onSaveGuest}
            onCancelEdit={() => {
              setGuestForm(null);
              setGuestPrefill(null);
              setFormError(null);
            }}
            onDelete={setPendingDelete}
            onEditGroup={(group) => {
              setGuestForm(null);
              setGuestPrefill(null);
              setFormError(null);
              setGroupForm(group);
            }}
            onSaveGroup={onSaveGroup}
            onCancelGroup={() => {
              setGroupForm(null);
              setFormError(null);
            }}
            onDeleteGroup={setPendingDeleteGroup}
            onAddGuestToGroup={(group) => {
              setGroupForm(null);
              setFormError(null);
              setGuestPrefill({ type: group.type, groupKey: group.groupKey });
              setGuestForm("new");
            }}
          />
          <GuestGroups
            title={t("friends")}
            groups={friends}
            catalogGroups={catalogGroups}
            editingGuest={guestForm === "new" ? null : guestForm}
            editingGroup={groupForm === "new" ? null : groupForm}
            creatingInGroup={guestForm === "new" ? guestPrefill : null}
            formBusy={formBusy}
            formError={formError}
            onAttendance={onAttendance}
            onEdit={(guest) => {
              setGroupForm(null);
              setGuestPrefill(null);
              setFormError(null);
              setGuestForm(guest);
            }}
            onSave={onSaveGuest}
            onCancelEdit={() => {
              setGuestForm(null);
              setGuestPrefill(null);
              setFormError(null);
            }}
            onDelete={setPendingDelete}
            onEditGroup={(group) => {
              setGuestForm(null);
              setGuestPrefill(null);
              setFormError(null);
              setGroupForm(group);
            }}
            onSaveGroup={onSaveGroup}
            onCancelGroup={() => {
              setGroupForm(null);
              setFormError(null);
            }}
            onDeleteGroup={setPendingDeleteGroup}
            onAddGuestToGroup={(group) => {
              setGroupForm(null);
              setFormError(null);
              setGuestPrefill({ type: group.type, groupKey: group.groupKey });
              setGuestForm("new");
            }}
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
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("confirmDeleteTitle", { name: pendingDelete?.name ?? "" })}
        body={t("confirmDeleteBody")}
        confirmLabel={t("deleteGuest")}
        cancelLabel={giftsT("cancel")}
        loading={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={onDeleteGuest}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteGroup)}
        title={t("confirmDeleteGroupTitle", {
          name: pendingDeleteGroup?.groupName ?? "",
        })}
        body={t("confirmDeleteGroupBody")}
        confirmLabel={t("deleteGroup")}
        cancelLabel={giftsT("cancel")}
        loading={busy}
        onClose={() => setPendingDeleteGroup(null)}
        onConfirm={onDeleteGroup}
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
  catalogGroups: AdminGroup[];
  editingGuest: AdminGuest | null;
  editingGroup: AdminGroup | null;
  creatingInGroup: { type: GuestType; groupKey: string } | null;
  formBusy: boolean;
  formError: string | null;
  onAttendance: (guest: AdminGuest, attending: AttendanceStatus) => void;
  onEdit: (guest: AdminGuest) => void;
  onSave: (payload: GuestWritePayload) => Promise<void>;
  onCancelEdit: () => void;
  onDelete: (guest: AdminGuest) => void;
  onEditGroup: (group: AdminGroup) => void;
  onSaveGroup: (payload: GroupWritePayload) => Promise<void>;
  onCancelGroup: () => void;
  onDeleteGroup: (group: AdminGuestGroup) => void;
  onAddGuestToGroup: (group: AdminGuestGroup) => void;
};

/** Maps a checklist group to the catalog shape used by the group form. */
function toCatalogGroup(group: AdminGuestGroup, catalog: AdminGroup[]): AdminGroup {
  return (
    catalog.find((item) => item.groupKey === group.groupKey) ?? {
      groupKey: group.groupKey,
      groupName: group.groupName,
      type: group.type,
      memberCount: group.members.length,
    }
  );
}

/** Renders grouped guest checklists with attendance and inline edit. */
function GuestGroups({
  title,
  groups,
  catalogGroups,
  editingGuest,
  editingGroup,
  creatingInGroup,
  formBusy,
  formError,
  onAttendance,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onEditGroup,
  onSaveGroup,
  onCancelGroup,
  onDeleteGroup,
  onAddGuestToGroup,
}: GuestGroupsProps) {
  const t = useTranslations("admin");

  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("emptyGroupType")}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {groups.map((group) => {
            const catalogGroup = toCatalogGroup(group, catalogGroups);
            const editingThisGroup = editingGroup?.groupKey === group.groupKey;

            return (
              <div
                key={group.groupKey}
                className="rounded-[var(--radius-card)] border border-border bg-surface p-4"
              >
                {editingThisGroup ? (
                  <GroupForm
                    key={group.groupKey}
                    initial={catalogGroup}
                    busy={formBusy}
                    error={formError}
                    embedded
                    onSubmit={onSaveGroup}
                    onCancel={onCancelGroup}
                  />
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-medium text-muted">{group.groupName}</h3>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 text-xs"
                        onClick={() => onAddGuestToGroup(group)}
                      >
                        {t("addGuest")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 text-xs"
                        onClick={() => onEditGroup(catalogGroup)}
                      >
                        {t("editGroup")}
                      </Button>
                      {group.members.length === 0 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-3 text-xs text-danger hover:text-danger"
                          onClick={() => onDeleteGroup(group)}
                        >
                          {t("deleteGroup")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )}
                {creatingInGroup?.groupKey === group.groupKey ? (
                  <div className="mt-3">
                    <GuestForm
                      key={`new-${group.groupKey}`}
                      groups={catalogGroups}
                      prefill={creatingInGroup}
                      busy={formBusy}
                      error={formError}
                      embedded
                      onSubmit={onSave}
                      onCancel={onCancelEdit}
                    />
                  </div>
                ) : null}
                {group.members.length === 0 && creatingInGroup?.groupKey !== group.groupKey && !editingThisGroup ? (
                  <p className="mt-3 text-sm text-muted">{t("emptyGroupMembers")}</p>
                ) : group.members.length > 0 ? (
                  <ul className="mt-3 divide-y divide-border">
                    {group.members.map((member) => (
                      <li key={member.id} className="py-3">
                        {editingGuest?.id === member.id ? (
                          <GuestForm
                            key={member.id}
                            groups={catalogGroups}
                            initial={member}
                            busy={formBusy}
                            error={formError}
                            embedded
                            onSubmit={onSave}
                            onCancel={onCancelEdit}
                          />
                        ) : (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-3 text-xs"
                                onClick={() => onEdit(member)}
                              >
                                {t("editGuest")}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-3 text-xs text-danger hover:text-danger"
                                onClick={() => onDelete(member)}
                              >
                                {t("deleteGuest")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
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
