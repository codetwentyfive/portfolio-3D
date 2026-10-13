"use client";

// Throwaway study: three background compositions on the real portfolio routes.
// ?variant=margin|field|syntax. Keep on the prototype branch until one is chosen.
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PrototypeRainCanvas from "./PrototypeRainCanvas";
import usePrototypeGravity from "./usePrototypeGravity";
import "./prototype-rain.css";

const variants = [
  { key: "margin", name: "Margin", note: "Fine trails · quiet centre" },
  { key: "field", name: "Field", note: "Scattered glyphs · open space" },
  { key: "syntax", name: "Syntax", note: "Small fragments · slow descent" },
] as const;

export default function PrototypeRain() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const enabled = process.env.NEXT_PUBLIC_RAIN_PROTOTYPE === "1" || params.has("variant");
  const index = Math.max(0, variants.findIndex(({ key }) => key === params.get("variant")));
  const variant = variants[index];
  const [paused, setPaused] = useState(false);
  const [original, setOriginal] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const gravity = usePrototypeGravity(!enabled || paused || original || reducedMotion);
  const motionMessage = reducedMotion
    ? "Still rain follows your reduced-motion setting."
    : original || paused
      ? "Resume the rain to use phone motion."
      : {
          off: "Optional. Your browser may ask for permission.",
          requesting: "Waiting for your browser's permission…",
          waiting: "Tilt your phone gently to start.",
          active: "Gravity on. Tilt slowly; lay flat to let it settle.",
          denied: "Permission declined. Ordinary rain is still on.",
          unavailable: "No sensor signal. Ordinary rain is still on.",
          insecure: "Phone motion needs HTTPS. Ordinary rain is still on.",
        }[gravity.status];

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const cycle = useCallback((direction: number) => {
    const next = variants[(index + direction + variants.length) % variants.length];
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("variant", next.key);
    router.replace(`${pathname}?${nextParams}`, { scroll: false });
    setOriginal(false);
  }, [index, params, pathname, router]);

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === "production") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.target instanceof Element && event.target.closest(
        "input, textarea, select, button, a, canvas, [contenteditable], [role=slider], [role=tablist]",
      )) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        cycle(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle, enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        className="prototype-rain-layer"
        data-variant={variant.key}
        data-original={original}
        aria-hidden="true"
      >
        <PrototypeRainCanvas variant={variant.key} paused={paused || original} gravityRef={gravity.gravityRef} />
      </div>
      <div className="prototype-rain-tools">
        <div className="prototype-rain-motion">
          <button
            type="button"
            onClick={gravity.enabled ? gravity.disable : gravity.enable}
            aria-pressed={gravity.enabled}
            aria-describedby="rain-motion-status"
            disabled={gravity.status === "requesting" || (!gravity.enabled && (reducedMotion || paused || original))}
          >{gravity.status === "requesting" ? "Asking permission…" : gravity.enabled ? "Stop phone motion" : "Use phone motion"}</button>
          <p id="rain-motion-status" role="status">{motionMessage}</p>
          <button
            type="button"
            disabled={reducedMotion || original}
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >{reducedMotion ? "Still" : paused ? "Play rain" : "Pause rain"}</button>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <aside className="prototype-rain-switcher" aria-label="Rain prototype controls">
            <div className="prototype-rain-caption">
              <span>Rain study</span>
              <span>{original ? "Original page" : reducedMotion ? "Still · reduced motion" : paused ? "Still" : "In motion"}</span>
            </div>
            <div className="prototype-rain-controls">
              <button type="button" onClick={() => cycle(-1)} aria-label="Previous rain composition">←</button>
              <div className="prototype-rain-current" aria-live="polite" aria-atomic="true">
                <strong><span>0{index + 1}</span> {variant.name}</strong>
                <small>{variant.note}</small>
              </div>
              <button type="button" onClick={() => cycle(1)} aria-label="Next rain composition">→</button>
              <span className="prototype-rain-divider" aria-hidden="true" />
              <button
                type="button"
                className="prototype-rain-text-button"
                aria-pressed={original}
                onClick={() => setOriginal(!original)}
              >{original ? "Show rain" : "Original"}</button>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
