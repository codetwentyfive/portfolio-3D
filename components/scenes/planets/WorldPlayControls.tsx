"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import type { PlanetKind } from "./planet-data";
import type { StageInstrument, StageTarget } from "./PlayableStage";

export default function WorldPlayControls({
  kind, open, onOpen, instrument, onInstrument, onPlay, sound, onSound, onAction, disabled,
}: {
  kind: PlanetKind;
  open: boolean;
  onOpen: (open: boolean) => void;
  instrument: StageInstrument | null;
  onInstrument: (instrument: StageInstrument | null) => void;
  onPlay: (target: StageTarget) => void;
  sound: boolean;
  onSound: () => void;
  onAction: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("worlds.play");
  const panel = useRef<HTMLElement | null>(null);
  const panelRef = useCallback((element: HTMLElement | null) => { panel.current = element; }, []);
  useEffect(() => {
    const element = panel.current;
    const stage = element?.parentElement;
    if (!element || !stage) return;
    let previousHeight = -1;
    const measure = () => {
      const height = Math.ceil(element.getBoundingClientRect().height);
      if (height === previousHeight) return;
      previousHeight = height;
      // Reserve the rendered panel, including wrapped labels and guest controls.
      // CSS supplies responsive spacing without updating React on every resize.
      stage.style.setProperty("--world-play-reserve", `calc(${height}px + var(--world-play-bottom) + var(--world-play-gap))`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      stage.style.removeProperty("--world-play-reserve");
    };
  }, [kind]);
  if (kind !== "seeds") return (
    <div ref={panelRef} className="world-play-controls world-play-single">
      <button type="button" onClick={onAction} disabled={disabled}>{t(`actions.${kind}`)} <span aria-hidden="true">↗</span></button>
      <span>{t("tap")}</span>
    </div>
  );
  return (
    <details ref={panelRef} className="world-play-controls" open={open} onToggle={(event) => onOpen(event.currentTarget.open)}>
      <summary>{t("stage")} <span aria-hidden="true">{open ? "−" : "+"}</span></summary>
      <div className="world-play-body">
        <p>{t("hint")}</p>
        <div className="world-play-pads" role="group" aria-label={t("stage")}>
          {(["kick", "snare", "cymbal", "guitar"] as const).map((target) => (
            <button type="button" key={target} disabled={disabled} onClick={() => onPlay(target)}>{t(target)}</button>
          ))}
        </div>
        <div className="world-play-instrument">
          <label htmlFor="guest-instrument">{t("add")}</label>
          <select id="guest-instrument" value={instrument ?? ""} disabled={disabled} onChange={(event) => onInstrument((event.target.value || null) as StageInstrument | null)}>
            <option value="">{t("none")}</option>
            {(["handpan", "xylophone", "bell"] as const).map((name) => <option key={name} value={name}>{t(name)}</option>)}
          </select>
          {instrument && <button type="button" disabled={disabled} onClick={() => onPlay("extra")}>{t("playGuest")}</button>}
        </div>
        <div className="world-play-footer">
          <span>{t("station")}</span>
          <button type="button" aria-pressed={sound} onClick={onSound}>{t(sound ? "soundOn" : "soundOff")}</button>
        </div>
      </div>
    </details>
  );
}
