"use client";

import { useTranslations } from "next-intl";
import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SONG_SRC = "/audio/song.mp3";
const DESIGNER_NAME = "Rubén Gómez";

/** Bottom music bar with Índigo and design credits. */
export function AudioPlayer() {
  const t = useTranslations("audio");
  const chrome = useTranslations("chrome");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    /** Checks whether the celebration song has been added to /public/audio. */
    async function detectSong() {
      try {
        const response = await fetch(SONG_SRC, { method: "HEAD" });
        if (!cancelled) setReady(response.ok);
      } catch {
        if (!cancelled) setReady(false);
      }
    }

    detectSong();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Starts or pauses playback after an explicit guest gesture. */
  function togglePlay() {
    const node = audioRef.current;
    if (!node || !ready) return;
    if (playing) {
      node.pause();
      setPlaying(false);
      return;
    }
    void node.play().then(() => setPlaying(true));
  }

  /** Mutes or unmutes without stopping the current track. */
  function toggleMute() {
    const node = audioRef.current;
    if (!node) return;
    node.muted = !node.muted;
    setMuted(node.muted);
  }

  return (
    <aside
      aria-label={t("title")}
      className="sticky bottom-0 z-30 border-t border-border bg-surface/90 px-4 py-3 backdrop-blur-md"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <audio
        ref={audioRef}
        src={ready ? SONG_SRC : undefined}
        preload="none"
        onEnded={() => setPlaying(false)}
      />
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-800 text-navy-50 dark:bg-watercolor-400 dark:text-navy-950">
            <Music2 className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" translate="no">
              {t("track")}
            </p>
            <p className="truncate text-sm text-muted" translate="no">
              {t("artists")}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            disabled={!ready}
            aria-label={muted ? t("unmute") : t("mute")}
            className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted enabled:hover:bg-surface-2 enabled:hover:text-foreground disabled:opacity-40"
          >
            {muted ? (
              <VolumeX className="size-5" aria-hidden />
            ) : (
              <Volume2 className="size-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            aria-label={playing ? t("pause") : t("play")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg enabled:hover:bg-accent-hover disabled:opacity-40"
          >
            {playing ? (
              <Pause className="size-5" aria-hidden />
            ) : (
              <Play className="size-5 translate-x-px" aria-hidden />
            )}
          </button>
        </div>
        <p
          className="self-end text-right text-xs text-muted sm:self-center"
          translate="no"
        >
          {chrome("credits", { name: DESIGNER_NAME })}
        </p>
      </div>
    </aside>
  );
}
