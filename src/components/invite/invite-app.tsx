"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { IdentifyPanel } from "./identify-panel";
import { InvitationHero, InvitationSkeleton } from "./invitation-hero";
import { GiftList } from "./gift-list";
import { Button } from "@/components/ui/button";
import { useGuestSession } from "@/components/chrome/guest-session";
import {
  fetchEvent,
  fetchGuestMe,
  identifyGuest,
  openGuestSession,
  pingHealth,
  releaseGift,
  reserveGift,
  updateAttendance,
} from "@/lib/api";
import { withMinimumDelay } from "@/lib/format";
import { getGuestToken, setGuestToken } from "@/lib/storage";
import { ApiError } from "@/lib/types";
import type { EventInfo, MeResponse, PublicMember } from "@/lib/types";

/** Client invitation flow: event card, identify, RSVP, and gift reservation. */
export function InviteApp() {
  const t = useTranslations();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState<PublicMember[] | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [session, setSession] = useState<MeResponse | null>(null);
  const [busyGift, setBusyGift] = useState<string | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState<"yes" | "no" | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const { setGuestName, setClearChoices } = useGuestSession();

  useEffect(() => {
    let cancelled = false;

    /** Loads public event copy and restores a saved guest session. */
    async function boot() {
      await pingHealth();
      try {
        const info = await withMinimumDelay(fetchEvent());
        if (cancelled) return;
        setEvent(info);
      } catch {
        if (!cancelled) setBootError("offline");
      }

      if (!getGuestToken()) return;
      try {
        const me = await fetchGuestMe();
        if (!cancelled) setSession(me);
      } catch {
        setGuestToken(null);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Looks up the guest group for the typed phone number. */
  async function onIdentify(nextPhone: string) {
    setIdentifyError(null);
    setIdentifying(true);
    setPhone(nextPhone);
    try {
      const result = await withMinimumDelay(identifyGuest(nextPhone));
      setMembers(result.members);
      setGroupName(result.groupName);
    } catch (error) {
      setIdentifyError(
        error instanceof ApiError ? error.message : t("status.error"),
      );
    } finally {
      setIdentifying(false);
    }
  }

  /** Creates a guest session after a name is chosen. */
  async function onSelect(guestId: string) {
    setIdentifyError(null);
    try {
      const result = await withMinimumDelay(openGuestSession(phone, guestId));
      setGuestToken(result.token);
      setSession(result);
      setMembers(null);
    } catch (error) {
      setIdentifyError(
        error instanceof ApiError ? error.message : t("status.error"),
      );
    }
  }

  /** Saves attendance and announces the result to assistive tech. */
  async function onAttendance(attending: boolean) {
    if (!session) return;
    const previous = session;
    setRsvpBusy(attending ? "yes" : "no");
    setSession({
      ...session,
      guest: { ...session.guest, attending },
    });
    try {
      const next = await withMinimumDelay(updateAttendance(attending));
      setSession(next);
      setLiveMessage(attending ? t("rsvp.savedYes") : t("rsvp.savedNo"));
    } catch (error) {
      setSession(previous);
      setLiveMessage(
        error instanceof ApiError ? error.message : t("status.error"),
      );
    } finally {
      setRsvpBusy(null);
    }
  }

  /** Reserves a gift for the current group. */
  async function onReserve(giftId: string) {
    setBusyGift(giftId);
    try {
      const next = await withMinimumDelay(reserveGift(giftId));
      setSession(next);
    } catch (error) {
      setLiveMessage(
        error instanceof ApiError ? error.message : t("status.error"),
      );
    } finally {
      setBusyGift(null);
    }
  }

  /** Releases the group's gift after confirmation. */
  async function onRelease(giftId: string) {
    setBusyGift(giftId);
    try {
      const next = await withMinimumDelay(releaseGift(giftId));
      setSession(next);
    } catch (error) {
      setLiveMessage(
        error instanceof ApiError ? error.message : t("status.error"),
      );
    } finally {
      setBusyGift(null);
    }
  }

  /** Clears the guest session so another person in the group can enter. */
  function onChangeGuest() {
    setGuestToken(null);
    setSession(null);
    setMembers(null);
    setPhone("");
  }

  /** Releases the group gift if needed, then drops the current guest session. */
  const clearChoices = useCallback(async () => {
    if (session?.groupReservation) {
      await releaseGift(session.groupReservation.giftId);
    }
    setGuestToken(null);
    setSession(null);
    setMembers(null);
    setPhone("");
  }, [session]);

  useEffect(() => {
    setGuestName(session?.guest.name ?? null);
    setClearChoices(session ? clearChoices : null);
  }, [session, clearChoices, setGuestName, setClearChoices]);

  useEffect(() => {
    return () => {
      setGuestName(null);
      setClearChoices(null);
    };
  }, [setGuestName, setClearChoices]);

  if (bootError) {
    return (
      <div className="rounded-[var(--radius-card)] bg-surface p-6 paper-shadow">
        <p role="alert" className="text-sm text-danger">
          {bootError === "offline" ? t("status.offline") : bootError}
        </p>
        <Button
          type="button"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          {t("status.retry")}
        </Button>
      </div>
    );
  }

  if (!event) return <InvitationSkeleton />;

  return (
    <div className="space-y-6">
      <InvitationHero event={event} />

      {session ? (
        <>
          <section className="rounded-[var(--radius-card)] bg-surface p-6 paper-shadow sm:p-8">
            <p className="font-display text-3xl">
              {t("studio.hello", { name: session.guest.name })}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t("studio.group", { groupName: session.groupName })} ·{" "}
              {session.type === "familia"
                ? t("studio.typeFamily")
                : t("studio.typeFriends")}
            </p>
            <button
              type="button"
              onClick={onChangeGuest}
              className="mt-3 min-h-11 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("studio.changeGuest")}
            </button>
          </section>

          <section className="rounded-[var(--radius-card)] bg-surface p-6 paper-shadow sm:p-8">
            <h2 className="font-display text-3xl">{t("rsvp.title")}</h2>
            <p className="mt-2 text-sm text-muted">{t("rsvp.lead")}</p>
            <p className="mt-3 text-sm">
              {session.guest.attending === true
                ? t("rsvp.savedYes")
                : session.guest.attending === false
                  ? t("rsvp.savedNo")
                  : t("rsvp.pending")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                loading={rsvpBusy === "yes"}
                variant={session.guest.attending === true ? "primary" : "secondary"}
                onClick={() => onAttendance(true)}
              >
                {t("rsvp.yes")}
              </Button>
              <Button
                type="button"
                loading={rsvpBusy === "no"}
                variant={session.guest.attending === false ? "danger" : "secondary"}
                onClick={() => onAttendance(false)}
              >
                {t("rsvp.no")}
              </Button>
            </div>
          </section>

          <GiftList
            babyName={event.babyName}
            gifts={session.gifts}
            reservation={session.groupReservation}
            busyId={busyGift}
            onReserve={onReserve}
            onRelease={onRelease}
          />
        </>
      ) : (
        <IdentifyPanel
          hint={t("identify.hint")}
          error={identifyError}
          loading={identifying}
          members={members}
          groupName={groupName}
          onIdentify={onIdentify}
          onSelect={onSelect}
          onReset={() => {
            setMembers(null);
            setIdentifyError(null);
          }}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
}
