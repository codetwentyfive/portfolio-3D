"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { gerStyles, planets, type GerStyle } from "./planets/planet-data";
import WorldControls from "./planets/WorldControls";
import type { StageHandle, StageInstrument } from "./planets/PlayableStage";
import type { SheepHandle } from "./planets/ShopSteppe";
import MobileWorldHUD from "./planets/MobileWorldHUD";
import { ControlGlyph } from "./planets/WorldGlyph";
import { wrapWorld } from "./planets/world-navigation";
import {
  initialWorldTransition,
  worldTransition,
  WORLD_ENTER_MS,
  WORLD_EXIT_MS,
  WORLD_LOAD_MS,
} from "./planets/world-transition";

const PlanetCanvas = dynamic(() => import("./planets/PlanetCanvas"), {
  ssr: false,
});
const subscribeMotion = (callback: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const reducedMotionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HomeScene() {
  const t = useTranslations("worlds");
  const a = useTranslations("archive");
  const locale = useLocale() === "de" ? "de" : "en";
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    reducedMotionSnapshot,
    () => true,
  );
  const [transition, dispatch] = useReducer(worldTransition, undefined, () =>
    initialWorldTransition(),
  );
  const selected = transition.current;
  const busy = transition.phase !== "idle";
  const prepared = useCallback(
    (index: number) => {
      dispatch({ type: "prepared", index, reduced: reducedMotion });
    },
    [reducedMotion],
  );
  const [style, setStyle] = useState<GerStyle>("paint");
  const [cycle, setCycle] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [stageEngaged, setStageEngaged] = useState(false);
  const [extraInstrument, setExtraInstrument] = useState<StageInstrument | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actionKey, setActionKey] = useState(0);
  const stageRef = useRef<StageHandle>(null);
  const sheepRef = useRef<SheepHandle>(null);
  const stagePlayed = useCallback(() => setStageEngaged(true), []);
  const [paused, setPaused] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [visible, setVisible] = useState(true);
  const [held, setHeld] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const section = useRef<HTMLElement>(null);
  const motion =
    !reducedMotion && !paused && visible && onScreen && !held && !busy && !controlsOpen && !(planets[selected].kind === "seeds" && stageEngaged);
  const planet = planets[selected];
  const isShop = planet.kind === "shop";

  useEffect(() => {
    const restore = () => {
      const kind = new URL(window.location.href).searchParams.get("world");
      const index = planets.findIndex((item) => item.kind === kind);
      dispatch({ type: "restore", index: index < 0 ? 0 : index });
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (transition.phase === "idle") return;
    const phase = transition.phase;
    const delay =
      phase === "loading"
        ? WORLD_LOAD_MS
        : phase === "exiting"
          ? WORLD_EXIT_MS
          : WORLD_ENTER_MS;
    const timer = window.setTimeout(
      () =>
        dispatch(
          phase === "loading"
            ? { type: "timeout" }
            : { type: "advance", phase },
        ),
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [transition.phase]);
  useEffect(() => {
    if (reducedMotion) dispatch({ type: "reduce" });
  }, [reducedMotion]);
  const lastSelected = useRef(selected);
  useEffect(() => {
    if (lastSelected.current === selected) return;
    lastSelected.current = selected;
    setZoomed(false);
    setControlsOpen(false);
    setStageEngaged(false);
    const url = new URL(window.location.href);
    url.searchParams.set("world", planets[selected].kind);
    window.history.replaceState(window.history.state, "", url);
  }, [selected]);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!section.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cycle || !motion || !isShop) return;
    const timer = window.setInterval(() => {
      setStyle(
        (current) =>
          gerStyles[(gerStyles.indexOf(current) + 1) % gerStyles.length],
      );
    }, 7200);
    return () => window.clearInterval(timer);
  }, [cycle, motion, isShop]);

  const selectWorld = (index: number) => {
    const next = wrapWorld(index, planets.length);
    dispatch({
      type: "request",
      index: next,
      direction: index < selected ? "previous" : "next",
    });
  };
  const selectStyle = (next: GerStyle) => {
    setStyle(next);
    setCycle(false);
  };
  const resetView = () => {
    setZoomed(false);
    setResetKey((key) => key + 1);
  };

  return (
    <section
      ref={section}
      data-held={held}
      data-world={planet.kind}
      data-direction={transition.direction}
      data-transition={transition.phase}
      className="planet-explorer studio-explorer"
      aria-label={t("label")}
    >
      <h1 className="sr-only">{a("heading")}</h1>
      <header className="studio-mobile-intro">
        <p className="studio-eyebrow">{a("mobile.eyebrow")}</p>
        <p className="studio-mobile-context">{a("mobile.context")}</p>
        <div key={planet.kind} className="studio-mobile-title">
          <h2>{a(`names.${planet.kind}`)}</h2>
          <p>{a(`mobile.descriptions.${planet.kind}`)}</p>
        </div>
      </header>
      <aside className="studio-index" aria-label={t("choose")}>
        <p className="studio-eyebrow">
          {a("index")} <span>{String(planets.length).padStart(2, "0")}</span>
        </p>
        <div className="studio-index-list">
          {planets.map((item, index) => (
            <button
              key={item.kind}
              type="button"
              className="studio-project"
              aria-pressed={index === selected}
              disabled={busy}
              onClick={() => selectWorld(index)}
            >
              <span className="studio-project-number">{item.number}</span>
              <span>{a(`names.${item.kind}`)}</span>
              <span className="studio-project-cursor" aria-hidden="true">
                /
              </span>
            </button>
          ))}
        </div>
        <p className="studio-signature">{a("signature")}</p>
      </aside>

      <div
        className="studio-stage"
        role="group"
        aria-label={isShop ? t("sceneDescription") : a(`scenes.${planet.kind}`)}
      >
        <div className="planet-stage studio-canvas" aria-busy={busy}>
          <PlanetCanvas
            index={selected}
            style={style}
            motion={motion}
            animateInteractions={!reducedMotion && visible && onScreen}
            stageRef={stageRef}
            sheepRef={sheepRef}
            extraInstrument={extraInstrument}
            soundEnabled={soundEnabled}
            onStagePlayed={stagePlayed}
            actionKey={actionKey}
            resetKey={resetKey}
            orbitStep={0}
            zoomed={zoomed}
            fallbackText={t("fallback")}
            onHoldChange={setHeld}
            interactionLabel={t(isShop ? "interactSheep" : "interact")}
            prepareIndex={
              transition.phase === "loading" ? transition.target : null
            }
            onPrepared={prepared}
          />
        </div>
        <button
          type="button"
          className="studio-scene-arrow studio-scene-previous"
          aria-label={t("previous")}
          disabled={busy}
          onClick={() => selectWorld(selected - 1)}
        >
          <ControlGlyph name="left" />
        </button>
        <button
          type="button"
          className="studio-scene-arrow studio-scene-next"
          aria-label={t("next")}
          disabled={busy}
          onClick={() => selectWorld(selected + 1)}
        >
          <ControlGlyph name="right" />
        </button>
        <WorldControls
          kind={planet.kind} open={controlsOpen} onOpen={setControlsOpen}
          zoomed={zoomed} onZoom={() => setZoomed((value) => !value)}
          paused={paused || (planet.kind === "seeds" && stageEngaged)} reducedMotion={reducedMotion}
          onPause={() => { if (planet.kind === "seeds" && stageEngaged) { setStageEngaged(false); setPaused(false); } else setPaused((value) => !value); }} onReset={resetView}
          style={style} onStyle={selectStyle} cycle={cycle} onCycle={() => setCycle((value) => !value)}
          instrument={extraInstrument} onInstrument={setExtraInstrument}
          onPlay={(target) => stageRef.current?.play(target)}
          onSheepPlay={(index) => sheepRef.current?.play(index)}
          sound={soundEnabled} onSound={() => setSoundEnabled((value) => !value)}
          onAction={() => setActionKey((value) => value + 1)} disabled={busy}
        />
        <p className="studio-transition-status" role="status">
          {transition.phase === "loading"
            ? a("mobile.loading")
            : transition.failed
              ? a("mobile.loadFailed")
              : ""}
        </p>
      </div>

      <div className="studio-caption">
        <div
          key={planet.kind}
          className="studio-caption-copy planet-copy-enter"
        >
          <p className="studio-eyebrow">
            {planet.number} <span>/ {a(`disciplines.${planet.kind}`)}</span>
          </p>
          <h2>{a(`names.${planet.kind}`)}</h2>
          <p className="studio-description">
            {a(`descriptions.${planet.kind}`)}
          </p>
        </div>
        <div className="studio-caption-actions">
          {planet.link && planet.kind !== "portfolio" ? (
            <a
              href={planet.link}
              target="_blank"
              rel="noopener noreferrer"
              className="studio-open"
            >
              {a("open")}
              <ControlGlyph name="enter" />
            </a>
          ) : (
            <Link
              href={planet.kind === "portfolio" ? "/about" : "/projects"}
              className="studio-open"
            >
              {t("details")}
              <ControlGlyph name="enter" />
            </Link>
          )}
          <div className="studio-paging">
            <button
              type="button"
              aria-label={t("previous")}
              disabled={busy}
              onClick={() => selectWorld(selected - 1)}
            >
              <ControlGlyph name="left" />
            </button>
            <span>
              {planet.number} / {String(planets.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              aria-label={t("next")}
              disabled={busy}
              onClick={() => selectWorld(selected + 1)}
            >
              <ControlGlyph name="right" />
            </button>
          </div>
        </div>
      </div>
      <MobileWorldHUD selected={selected} onSelect={selectWorld} busy={busy} />
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {t("selected")}: {planet.name[locale]}
      </span>
    </section>
  );
}
