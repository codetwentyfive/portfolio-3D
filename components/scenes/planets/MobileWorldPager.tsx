"use client";

import { useRef, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { planets } from "./planet-data";
import { ControlGlyph } from "./WorldGlyph";
import {
  finishWorldSwipe,
  moveWorldSwipe,
  startWorldSwipe,
  wrapWorld,
  type WorldSwipe,
} from "./world-navigation";

export default function MobileWorldPager({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("worlds");
  const a = useTranslations("archive");
  const swipe = useRef<WorldSwipe | null>(null);
  const previous = planets[wrapWorld(selected - 1, planets.length)];
  const next = planets[wrapWorld(selected + 1, planets.length)];

  const cancel = (event: PointerEvent<HTMLDivElement>) => {
    if (swipe.current?.pointer !== event.pointerId) return;
    swipe.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <nav className="studio-mobile-pager" aria-label={t("choose")}>
      <div
        className="studio-world-swipe"
        role="group"
        tabIndex={0}
        aria-label={a("mobile.swipeLabel")}
        aria-describedby="world-swipe-hint"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          onSelect(selected + (event.key === "ArrowLeft" ? -1 : 1));
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || swipe.current) return;
          swipe.current = startWorldSwipe(
            event.pointerId,
            event.clientX,
            event.clientY,
          );
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (swipe.current)
            moveWorldSwipe(
              swipe.current,
              event.pointerId,
              event.clientX,
              event.clientY,
            );
        }}
        onPointerUp={(event) => {
          if (swipe.current?.pointer !== event.pointerId) return;
          const direction = finishWorldSwipe(
            swipe.current,
            event.pointerId,
            event.clientX,
            event.clientY,
          );
          cancel(event);
          if (direction) onSelect(selected + direction);
        }}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onBlur={() => {
          swipe.current = null;
        }}
      >
        <p id="world-swipe-hint">{a("mobile.swipe")}</p>
        <span className="studio-world-count">
          <b>{planets[selected].number}</b> /{" "}
          {String(planets.length).padStart(2, "0")}
        </span>
        <div className="studio-world-progress" aria-hidden="true">
          {planets.map((planet, index) => (
            <span key={planet.kind} data-active={selected === index} />
          ))}
        </div>
      </div>
      <div className="studio-world-neighbors">
        <button
          type="button"
          onClick={() => onSelect(selected - 1)}
          aria-label={`${t("previous")}: ${a(`names.${previous.kind}`)}`}
        >
          <ControlGlyph name="left" />
          <span>
            <small>{a("mobile.previous")}</small>
            {a(`names.${previous.kind}`)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelect(selected + 1)}
          aria-label={`${t("next")}: ${a(`names.${next.kind}`)}`}
        >
          <span>
            <small>{a("mobile.next")}</small>
            {a(`names.${next.kind}`)}
          </span>
          <ControlGlyph name="right" />
        </button>
      </div>
    </nav>
  );
}
