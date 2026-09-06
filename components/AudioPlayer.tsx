"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";
import { useSoundCloud } from "@/hooks/useSoundCloud";
import {
  formatAudioTime,
  PLAYLIST_URL,
} from "@/lib/audio/soundcloud-controller";
import AudioGlyph from "./audio/AudioGlyph";

const EMBED_URL =
  "https://w.soundcloud.com/player/?url=" +
  encodeURIComponent(PLAYLIST_URL) +
  "&auto_play=false&buying=false&sharing=false&download=false&show_artwork=false&show_playcount=false&show_user=false&single_active=true&visual=false&color=%23a34526";

export default function AudioPlayer() {
  const t = useTranslations("music");
  const pathname = usePathname();
  const audio = useSoundCloud();
  const { state, connected, controller } = audio;
  const [open, setOpen] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const playing = state.status === "playing";
  const pending = state.status === "starting" || state.status === "pausing";
  const canControl = connected && !["loading", "error"].includes(state.status);
  const statusText = t("status." + state.status);
  const transportLabel =
    state.status === "starting"
      ? t("cancelPlay")
      : state.status === "pausing"
        ? statusText
        : t(playing ? "pause" : "play");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      opener.current?.focus();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    opener.current?.focus();
  };
  const connect = () => {
    setNativeOpen(false);
    audio.connect();
  };
  const disconnect = () => {
    setNativeOpen(false);
    audio.disconnect();
    closeButton.current?.focus();
  };

  return (
    <div
      ref={root}
      className="portfolio-audio"
      data-playing={playing}
      data-expanded={open}
    >
      <div className="music-launcher refractive-glass">
        {canControl && (
          <button
            type="button"
            className="music-quick-play"
            onClick={() => controller.current?.toggle()}
            disabled={state.status === "pausing"}
            aria-label={transportLabel}
          >
            {pending ? (
              <span className="music-spinner" aria-hidden="true" />
            ) : (
              <AudioGlyph name={playing ? "pause" : "play"} />
            )}
          </button>
        )}
        <button
          ref={opener}
          type="button"
          className="music-disclosure"
          aria-label={t(open ? "close" : "open") + ": " + statusText}
          aria-expanded={open}
          aria-controls="music-panel"
          aria-haspopup="dialog"
          onClick={() => setOpen((value) => !value)}
        >
          <AudioGlyph name="sound" />
          <span className="music-launcher-label">
            {t("sound")}
            <span>{statusText}</span>
          </span>
          <span className="music-chevron">
            <AudioGlyph name="expand" />
          </span>
        </button>
      </div>

      <section
        id="music-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="music-heading"
        className="music-panel refractive-glass"
        hidden={!open}
      >
        <header className="music-panel-header">
          <div>
            <p className="music-kicker">{t("sound")} / CHINGIS</p>
            <h2 id="music-heading">{t("heading")}</h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            className="music-icon"
            aria-label={t("close")}
            onClick={close}
          >
            <AudioGlyph name="close" />
          </button>
        </header>

        <div className="music-status" role="status" aria-live="polite">
          <span
            className={
              playing ? "music-status-dot is-playing" : "music-status-dot"
            }
            aria-hidden="true"
          />
          {statusText}
        </div>

        {!connected ? (
          <div className="music-intro">
            <p>{t("intro")}</p>
            <p className="music-note">{t("consent")}</p>
            <button type="button" className="music-primary" onClick={connect}>
              {t("enable")}
            </button>
            <Link href="/rechtliches#datenschutz" className="music-text-link">
              {t("privacy")}
            </Link>
          </div>
        ) : state.status === "loading" ? (
          <div className="music-message">
            <span className="music-spinner" aria-hidden="true" />
            <p>{t("loadingHelp")}</p>
          </div>
        ) : state.status === "error" ? (
          <div className="music-intro">
            <p>{t("errorHelp")}</p>
            <button type="button" className="music-primary" onClick={connect}>
              {t("retry")}
            </button>
          </div>
        ) : (
          <>
            <div className="music-track">
              <span className="music-track-number" aria-hidden="true">
                {String(state.index + 1).padStart(2, "0")}
              </span>
              <div>
                <a href={state.url} target="_blank" rel="noopener noreferrer">
                  {state.title || t("playlist")}
                </a>
                <p>
                  Chingis
                  {state.count > 0
                    ? " / " +
                      t("trackCount", {
                        current: state.index + 1,
                        total: state.count,
                      })
                    : ""}
                </p>
              </div>
            </div>
            <div className="music-transport">
              <button
                type="button"
                className="music-icon"
                aria-label={t("previous")}
                disabled={state.count < 2 || pending}
                onClick={() => controller.current?.navigate(-1)}
              >
                <AudioGlyph name="previous" />
              </button>
              <button
                type="button"
                className="music-main-play"
                onClick={() => controller.current?.toggle()}
                aria-label={transportLabel}
                disabled={state.status === "pausing"}
              >
                {pending ? (
                  <span className="music-spinner" aria-hidden="true" />
                ) : (
                  <AudioGlyph name={playing ? "pause" : "play"} />
                )}
                <span>{transportLabel}</span>
              </button>
              <button
                type="button"
                className="music-icon"
                aria-label={t("next")}
                disabled={state.count < 2 || pending}
                onClick={() => controller.current?.navigate(1)}
              >
                <AudioGlyph name="next" />
              </button>
            </div>
            <div className="music-timeline">
              <input
                type="range"
                min="0"
                max={Math.max(1, state.duration)}
                step="1000"
                value={Math.min(state.position, state.duration)}
                disabled={state.duration <= 0}
                aria-label={t("seek")}
                aria-valuetext={
                  formatAudioTime(state.position) +
                  " / " +
                  formatAudioTime(state.duration)
                }
                onChange={(event) =>
                  controller.current?.seek(Number(event.target.value))
                }
              />
              <div>
                <span>{formatAudioTime(state.position)}</span>
                <span>{formatAudioTime(state.duration)}</span>
              </div>
            </div>
            <div className="music-options">
              <label>
                {t("volume")}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={state.volume}
                  onChange={(event) =>
                    controller.current?.volume(Number(event.target.value))
                  }
                />
              </label>
              <button
                type="button"
                className="music-icon"
                aria-label={t("repeat")}
                aria-pressed={state.repeat}
                onClick={() => controller.current?.repeat()}
              >
                <AudioGlyph name="repeat" />
              </button>
            </div>
            {state.status === "blocked" && (
              <p className="music-note music-blocked">{t("blockedHelp")}</p>
            )}
          </>
        )}

        {connected && (
          <button
            type="button"
            className="music-text-link music-native-toggle"
            aria-expanded={nativeOpen}
            aria-controls="soundcloud-native"
            onClick={() => {
              if (!nativeOpen) controller.current?.allowNativeControls();
              setNativeOpen((value) => !value);
            }}
          >
            {t(nativeOpen ? "hideNative" : "showNative")}
          </button>
        )}

        {connected && (
          <div
            id="soundcloud-native"
            hidden={!nativeOpen}
            className="music-native"
          >
            <p className="music-note">{t("nativeHelp")}</p>
            <iframe
              key={audio.attempt}
              ref={audio.iframe}
              src={EMBED_URL}
              allow="autoplay"
              title={t("embedTitle")}
              tabIndex={open && nativeOpen ? 0 : -1}
              aria-hidden={!open || !nativeOpen}
            />
          </div>
        )}

        <footer className="music-panel-footer">
          <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer">
            SoundCloud <AudioGlyph name="external" />
          </a>
          {connected && (
            <button type="button" onClick={disconnect}>
              {t(
                state.status === "loading" ? "cancelConnection" : "disconnect",
              )}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
