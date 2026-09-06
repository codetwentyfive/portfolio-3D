"use client";

import { useRef, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { planets } from "./planet-data";
import {
  finishWorldSwipe,
  moveWorldSwipe,
  startWorldSwipe,
  type WorldSwipe,
} from "./world-navigation";

export default function MobileWorldPager({
  selected,
  onSelect,
  busy,
}: {
  selected: number;
  onSelect: (index: number) => void;
  busy: boolean;
}) {
  const t = useTranslations("worlds");
  const a = useTranslations("archive");
  const swipe = useRef<WorldSwipe | null>(null);

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
        aria-disabled={busy}
        onKeyDown={(event) => {
          if (busy) return;
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          onSelect(selected + (event.key === "ArrowLeft" ? -1 : 1));
        }}
        onPointerDown={(event) => {
          if (busy || !event.isPrimary || event.button !== 0 || swipe.current)
            return;
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
          if (direction && !busy) onSelect(selected + direction);
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
    </nav>
  );
}
