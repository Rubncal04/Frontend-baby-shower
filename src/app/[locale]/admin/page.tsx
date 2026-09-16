import { SkipLink } from "@/components/chrome/skip-link";
import { SiteHeader } from "@/components/chrome/site-header";
import { WatercolorBackdrop } from "@/components/chrome/watercolor-backdrop";
import { AdminApp } from "@/components/admin/admin-app";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Suspense } from "react";

/** Host dashboard for attendance and gift reservations. */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const a11y = await getTranslations("a11y");

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink label={a11y("skip")} />
      <WatercolorBackdrop />
      <SiteHeader admin />
      <main
        id="contenido"
        aria-label={t("title")}
        className="relative mx-auto w-full max-w-5xl flex-1 scroll-mt-24 px-4 py-8 pb-32"
      >
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface paper-shadow" />
          }
        >
          <AdminApp />
        </Suspense>
      </main>
    </div>
  );
}
