"use client";

import { useTranslations } from "next-intl";
import type { PlanetKind } from "./planet-data";
import type { StageInstrument, StageTarget } from "./PlayableStage";

export default function WorldPlayControls({
  kind, instrument, onInstrument, onPlay, onSheepPlay, sound, onSound, onAction, disabled,
}: {
  kind: PlanetKind;
  instrument: StageInstrument | null;
  onInstrument: (instrument: StageInstrument | null) => void;
  onPlay: (target: StageTarget) => void;
  onSheepPlay: (index: number) => void;
  sound: boolean;
  onSound: () => void;
  onAction: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("worlds.play");
  if (kind === "shop") return (
    <div className="world-play-controls">
      <div className="world-play-body">
        <p>{t("sheepSong")}</p>
        <div className="world-play-pads world-play-sheep" role="group" aria-label={t("sheepChoir")}>
          {(["low", "middle", "high"] as const).map((voice, index) => (
            <button type="button" key={voice} disabled={disabled} onClick={() => onSheepPlay(index)}>{t(`sheepVoices.${voice}`)}</button>
          ))}
        </div>
        <div className="world-play-footer">
          <button type="button" aria-pressed={sound} onClick={onSound}>{t(sound ? "soundOn" : "soundOff")}</button>
        </div>
      </div>
    </div>
  );
  if (kind !== "seeds") return (
    <div className="world-play-single">
      <button type="button" onClick={onAction} disabled={disabled}>{t(`actions.${kind}`)} <span aria-hidden="true">↗</span></button>
    </div>
  );
  return (
    <div className="world-play-controls">
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
    </div>
  );
}
