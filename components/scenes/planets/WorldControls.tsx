"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { gerStyles, type GerStyle, type PlanetKind } from "./planet-data";
import { ControlGlyph } from "./WorldGlyph";
import WorldPlayControls from "./WorldPlayControls";
import type { StageInstrument, StageTarget } from "./PlayableStage";

export default function WorldControls({
  kind, open, onOpen, zoomed, onZoom, paused, reducedMotion, onPause, onReset,
  style, onStyle, cycle, onCycle, instrument, onInstrument, onPlay, sound, onSound, onAction, disabled,
}: {
  kind: PlanetKind;
  open: boolean;
  onOpen: (open: boolean) => void;
  zoomed: boolean;
  onZoom: () => void;
  paused: boolean;
  reducedMotion: boolean;
  onPause: () => void;
  onReset: () => void;
  style: GerStyle;
  onStyle: (style: GerStyle) => void;
  cycle: boolean;
  onCycle: () => void;
  instrument: StageInstrument | null;
  onInstrument: (instrument: StageInstrument | null) => void;
  onPlay: (target: StageTarget) => void;
  sound: boolean;
  onSound: () => void;
  onAction: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("worlds");
  const a = useTranslations("archive");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) onOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, onOpen]);

  return (
    <div ref={container} className="scene-options">
      <button ref={trigger} type="button" className="scene-options-trigger"
        aria-label={t("options.title")} title={t("options.title")}
        aria-expanded={open} aria-controls="scene-options-panel" onClick={() => onOpen(!open)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open && (
        <section id="scene-options-panel" className="scene-options-panel" aria-label={t("options.title")}>
          <header><h3>{t("options.title")}</h3><button type="button" aria-label={t("options.close")} onClick={() => { onOpen(false); trigger.current?.focus(); }}><span aria-hidden="true">×</span></button></header>
          <div className="scene-options-view">
            <button type="button" aria-pressed={zoomed} onClick={onZoom}><ControlGlyph name="zoom" />{a(zoomed ? "zoomOut" : "zoomIn")}</button>
            <button type="button" aria-pressed={paused || reducedMotion} disabled={reducedMotion} onClick={onPause}><ControlGlyph name={paused || reducedMotion ? "play" : "pause"} />{t(paused || reducedMotion ? "resume" : "pause")}</button>
            <button type="button" onClick={onReset}><ControlGlyph name="reset" />{t("reset")}</button>
          </div>
          {kind === "shop" && (
            <div className="scene-options-material">
              <label htmlFor="world-finish">{t("material")}</label>
              <select id="world-finish" value={style} onChange={(event) => onStyle(event.target.value as GerStyle)}>
                {gerStyles.map((finish) => <option key={finish} value={finish}>{t(finish)}</option>)}
              </select>
              <button type="button" aria-pressed={cycle} onClick={onCycle}><ControlGlyph name="cycle" />{t("auto")}</button>
            </div>
          )}
          <div className="scene-options-play">
            <h4>{t("options.interactions")}</h4>
            <WorldPlayControls kind={kind} instrument={instrument} onInstrument={onInstrument} onPlay={onPlay} sound={sound} onSound={onSound} onAction={onAction} disabled={disabled} />
            {kind === "shop" && <p className="scene-options-help">{t("options.sheepKeys")}</p>}
          </div>
        </section>
      )}
    </div>
  );
}
