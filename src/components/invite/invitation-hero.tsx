"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, MapPin } from "lucide-react";
import { formatEventWhen } from "@/lib/format";
import type { EventInfo } from "@/lib/types";

type InvitationHeroProps = {
  event: EventInfo;
};

/** Recreates the watercolor invitation card with live event data. */
export function InvitationHero({ event }: InvitationHeroProps) {
  const t = useTranslations("event");
  const locale = useLocale();
  const name = event.babyName;

  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] bg-surface paper-shadow">
      <div className="relative isolate px-6 pb-8 pt-10 text-center sm:px-10">
        <p className="font-script text-4xl text-navy-950 dark:text-watercolor-200 sm:text-5xl">
          {t("kicker")}
        </p>
        <h1
          className="mt-1 font-display text-6xl font-semibold tracking-tight text-navy-950 dark:text-paper-50 sm:text-7xl"
          translate="no"
        >
          {name}
        </h1>
        <div className="relative mx-auto mt-6 aspect-[4/5] max-w-sm overflow-hidden rounded-[1.25rem]">
          <Image
            src="/art/invitation-10-octubre.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 90vw, 420px"
            className="object-cover object-[center_35%]"
            aria-hidden
          />
        </div>
        <p className="mt-6 font-display text-xl italic text-navy-800 dark:text-watercolor-100">
          {t("tagline", { name })}
        </p>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        <div className="mx-auto mt-6 max-w-md rounded-[var(--radius-control)] bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--wash)_35%,transparent),transparent)] px-4 py-4">
          <p className="flex items-start justify-center gap-2 text-sm font-medium">
            <Calendar className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">{t("date")}: </span>
              {formatEventWhen(event.date, event.time, locale)}
            </span>
          </p>
          <p className="mt-2 flex items-start justify-center gap-2 text-sm font-medium">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span translate="no">
              <span className="sr-only">{t("address")}: </span>
              {event.address}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Placeholder that mirrors the invitation card to avoid layout shift. */
export function InvitationSkeleton() {
  return (
    <div className="h-[38rem] animate-pulse rounded-[var(--radius-card)] bg-surface paper-shadow" />
  );
}
