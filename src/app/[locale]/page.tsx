import { SkipLink } from "@/components/chrome/skip-link";
import { SiteHeader } from "@/components/chrome/site-header";
import { WatercolorBackdrop } from "@/components/chrome/watercolor-backdrop";
import { AudioPlayer } from "@/components/chrome/audio-player";
import { GuestSessionProvider } from "@/components/chrome/guest-session";
import { InviteApp } from "@/components/invite/invite-app";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

/** Public invitation page: watercolor card, identify flow, RSVP, and gifts. */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("a11y");

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink label={t("skip")} />
      <WatercolorBackdrop />
      <GuestSessionProvider>
        <SiteHeader />
        <main
          id="contenido"
          aria-label={t("main")}
          className="relative mx-auto w-full max-w-2xl flex-1 scroll-mt-24 px-4 py-8 pb-32"
        >
          <InviteApp />
        </main>
        <AudioPlayer />
      </GuestSessionProvider>
    </div>
  );
}
