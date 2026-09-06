"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { gerStyles, planets, type GerStyle } from "./planet-data";
import { ControlGlyph } from "./WorldGlyph";
import MobileWorldPager from "./MobileWorldPager";

const finishes = {
  paint: "finish-paint",
  blueprint: "finish-blueprint",
  alloy: "finish-alloy",
  clay: "finish-clay",
};

export default function MobileWorldHUD({
  selected,
  style,
  cycle,
  paused,
  reducedMotion,
  onSelect,
  onStyle,
  onCycle,
  onPause,
  onReset,
  zoomed,
  onZoom,
  held,
}: {
  selected: number;
  style: GerStyle;
  cycle: boolean;
  paused: boolean;
  reducedMotion: boolean;
  onSelect: (index: number) => void;
  onStyle: (style: GerStyle) => void;
  onCycle: () => void;
  onPause: () => void;
  onReset: () => void;
  zoomed: boolean;
  onZoom: () => void;
  held: boolean;
}) {
  const t = useTranslations("worlds");
  const a = useTranslations("archive");
  const locale = useLocale() === "de" ? "de" : "en";
  const planet = planets[selected];
  const external = Boolean(planet.link && planet.kind !== "portfolio");
  const visitLabel = `${external ? a("open") : t("details")}: ${planet.name[locale]}`;
  return (
    <div className="studio-mobile-hud">
      <p className="studio-mobile-gesture">
        {held ? a("held") : a("mobile.rotate")}
      </p>
      <div className="studio-mobile-actions">
        <details className="studio-mobile-view">
          <summary>
            <ControlGlyph name="settings" />
            {a("mobile.view")}
          </summary>
          <div className="studio-mobile-tools">
            <button
              type="button"
              className="studio-icon"
              aria-label={a(zoomed ? "zoomOut" : "zoomIn")}
              aria-pressed={zoomed}
              onClick={onZoom}
            >
              <ControlGlyph name="zoom" />
            </button>
            <button
              type="button"
              className="studio-icon"
              onClick={onPause}
              disabled={reducedMotion}
              aria-pressed={paused || reducedMotion}
              aria-label={paused ? t("resume") : t("pause")}
            >
              <ControlGlyph name={paused || reducedMotion ? "play" : "pause"} />
            </button>
            <button
              type="button"
              className="studio-icon"
              onClick={onReset}
              aria-label={t("reset")}
            >
              <ControlGlyph name="reset" />
            </button>
            {planet.kind === "shop" && (
              <details className="studio-mobile-materials">
                <summary className="studio-icon" aria-label={t("material")}>
                  <ControlGlyph name="settings" />
                </summary>
                <div
                  className="studio-mobile-finishes refractive-glass"
                  role="group"
                  aria-label={t("material")}
                >
                  {gerStyles.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`visual-finish ${finishes[item]}`}
                      aria-label={t(item)}
                      aria-pressed={style === item}
                      onClick={() => onStyle(item)}
                    >
                      <span aria-hidden="true" />
                    </button>
                  ))}
                  <button
                    type="button"
                    className="studio-icon"
                    aria-label={t("auto")}
                    aria-pressed={cycle}
                    onClick={onCycle}
                  >
                    <ControlGlyph name="cycle" />
                  </button>
                </div>
              </details>
            )}
          </div>
        </details>
        {planet.link && planet.kind !== "portfolio" ? (
          <a
            href={planet.link}
            target="_blank"
            rel="noopener noreferrer"
            className="studio-mobile-open"
            aria-label={visitLabel}
          >
            <span>{a("open")}</span>
            <ControlGlyph name="enter" />
          </a>
        ) : (
          <Link
            href={planet.kind === "portfolio" ? "/about" : "/projects"}
            className="studio-mobile-open"
            aria-label={visitLabel}
          >
            <span>{t("details")}</span>
            <ControlGlyph name="enter" />
          </Link>
        )}
      </div>
      <MobileWorldPager selected={selected} onSelect={onSelect} />
    </div>
  );
}
