"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GiftIcon } from "./gift-icon";
import { isGiftNameId } from "@/lib/gift-names";
import type { GroupReservation, PublicGift } from "@/lib/types";

type GiftListProps = {
  babyName: string;
  gifts: PublicGift[];
  reservation: GroupReservation | null;
  busyId: string | null;
  onReserve: (giftId: string) => Promise<void>;
  onRelease: (giftId: string) => Promise<void>;
};

/** Numbered gift catalog with one reservation per group. */
export function GiftList({
  babyName,
  gifts,
  reservation,
  busyId,
  onReserve,
  onRelease,
}: GiftListProps) {
  const t = useTranslations("gifts");
  const eventT = useTranslations("event");
  const [pendingRelease, setPendingRelease] = useState<PublicGift | null>(null);

  /** Returns the localized gift title, falling back to the API name. */
  function giftLabel(gift: { id: string; name: string }): string {
    return isGiftNameId(gift.id) ? t(`names.${gift.id}`) : gift.name;
  }

  return (
    <section className="rounded-[var(--radius-card)] bg-surface p-6 paper-shadow sm:p-8">
      <h2 className="font-display text-3xl">
        {t("title", { name: babyName })}
      </h2>
      <p className="mt-2 text-sm text-muted">{t("lead")}</p>
      {reservation ? (
        <p className="mt-3 rounded-[var(--radius-control)] bg-sage-100 px-3 py-2 text-sm text-sage-800 dark:bg-sage-800 dark:text-sage-100">
          {t("groupHasOne", {
            name: giftLabel({
              id: reservation.giftId,
              name: reservation.giftName,
            }),
          })}
        </p>
      ) : null}

      {gifts.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{t("empty")}</p>
      ) : (
        <ol className="mt-6 space-y-2">
          {gifts.map((gift, index) => {
            const label = giftLabel(gift);
            const yours = gift.reservedByGroup;
            const taken = gift.reserved && !yours;
            const blocked = Boolean(reservation) && !yours;
            return (
              <li
                key={gift.id}
                className="flex items-center gap-3 rounded-[var(--radius-control)] border border-transparent px-2 py-2 hover:border-border hover:bg-background"
              >
                <span className="w-6 text-right font-display text-lg tabular text-muted">
                  {index + 1}.
                </span>
                <span className="flex size-10 items-center justify-center rounded-full bg-watercolor-100 text-navy-800 dark:bg-navy-800 dark:text-watercolor-100">
                  <GiftIcon name={gift.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{label}</p>
                  {yours ? (
                    <p className="text-xs text-sage-700 dark:text-sage-300">
                      {t("yours")}
                    </p>
                  ) : taken ? (
                    <p className="text-xs text-muted">{t("reserved")}</p>
                  ) : null}
                </div>
                {yours ? (
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busyId === gift.id}
                    onClick={() => setPendingRelease(gift)}
                  >
                    {t("release")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busyId === gift.id}
                    disabled={taken || blocked}
                    onClick={() => onReserve(gift.id)}
                  >
                    {t("reserve")}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-8 text-center font-script text-2xl text-navy-800 dark:text-watercolor-200">
        {eventT("giftListFooter")}
      </p>

      <ConfirmDialog
        open={Boolean(pendingRelease)}
        title={t("confirmReleaseTitle")}
        body={t("confirmReleaseBody", {
          name: pendingRelease ? giftLabel(pendingRelease) : "",
        })}
        confirmLabel={t("confirmReleaseAction")}
        cancelLabel={t("cancel")}
        loading={busyId === pendingRelease?.id}
        onClose={() => setPendingRelease(null)}
        onConfirm={async () => {
          if (!pendingRelease) return;
          await onRelease(pendingRelease.id);
          setPendingRelease(null);
        }}
      />
    </section>
  );
}
