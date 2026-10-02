"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import worldVersions from "@/assets/world-versions.json";
import { planets } from "./planets/planet-data";
import { ControlGlyph } from "./planets/WorldGlyph";
import type { StageHandle } from "./planets/PlayableStage";
import type { SheepHandle } from "./planets/ShopSteppe";

const PlanetCanvas = dynamic(() => import("./planets/PlanetCanvas"), { ssr: false });
const denkpauseIndex = planets.findIndex((planet) => planet.kind === "denkpause");
const noop = () => {};

class ViewerBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function DenkpauseViewer() {
  const d = useTranslations("denkpause");
  const t = useTranslations("worlds");
  const a = useTranslations("archive");
  const host = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageHandle>(null);
  const sheepRef = useRef<SheepHandle>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [orbitStep, setOrbitStep] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setFailed(true); setReady(false); }, []);

  useEffect(() => {
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "")) return;
    if (!host.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setEnabled(true);
      observer.disconnect();
    }, { rootMargin: "150px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled || ready || failed) return;
    const timer = window.setTimeout(onFailure, 12000);
    return () => window.clearTimeout(timer);
  }, [enabled, ready, failed, attempt, onFailure]);

  const enable = async () => {
    if (failed) {
      try {
        const { clearDenkpauseAsset } = await import("./planets/PlanetCanvas");
        clearDenkpauseAsset();
      } catch {
        return;
      }
    }
    setReady(false);
    setFailed(false);
    setAttempt((value) => value + 1);
    setEnabled(true);
  };
  const reset = () => {
    setZoomed(false);
    setResetKey((value) => value + 1);
  };

  return (
    <figure className="denkpause-viewer" aria-label={d("scene")} data-state={failed ? "failed" : ready ? "ready" : enabled ? "loading" : "static"}>
      <div ref={host} className="case-viewer-stage" aria-busy={enabled && !ready && !failed}>
        <Image className="case-viewer-poster" src={`/images/worlds/denkpause-v${worldVersions.denkpause}.webp`} alt="" fill sizes="(min-width: 1120px) 1120px, 100vw" priority unoptimized />
        {enabled && !failed && <ViewerBoundary key={attempt} onFailure={onFailure}>
          <div className="world-enhancement" data-ready={ready} aria-hidden={!ready} inert={!ready}>
            <PlanetCanvas
              index={denkpauseIndex}
              style="paint"
              motion={false}
              animateInteractions={false}
              stageRef={stageRef}
              sheepRef={sheepRef}
              extraInstrument={null}
              soundEnabled={false}
              onStagePlayed={noop}
              actionKey={0}
              resetKey={resetKey}
              orbitStep={orbitStep}
              zoomed={zoomed}
              fallbackText={t("fallback")}
              interactionLabel={t("interact")}
              onHoldChange={noop}
              onReady={onReady}
              onFailure={onFailure}
              prepareIndex={null}
              onPrepared={noop}
            />
          </div>
        </ViewerBoundary>}
        {(!enabled || failed) && <button className="case-viewer-enable" type="button" onClick={enable}>{d("interactive")} <span aria-hidden="true">↗</span></button>}
      </div>
      <figcaption className="case-viewer-toolbar">
        {ready && <><span>{a("drag")}</span>
        <div role="group" aria-label={t("options.title")}>
          <button type="button" aria-label={t("rotateLeft")} title={t("rotateLeft")} onClick={() => setOrbitStep((step) => step - 1)}><ControlGlyph name="left" /></button>
          <button type="button" aria-label={t("rotateRight")} title={t("rotateRight")} onClick={() => setOrbitStep((step) => step + 1)}><ControlGlyph name="right" /></button>
          <button type="button" aria-pressed={zoomed} aria-label={a(zoomed ? "zoomOut" : "zoomIn")} title={a(zoomed ? "zoomOut" : "zoomIn")} onClick={() => setZoomed((value) => !value)}><ControlGlyph name="zoom" /></button>
          <button type="button" aria-label={t("reset")} title={t("reset")} onClick={reset}><ControlGlyph name="reset" /></button>
        </div></>}
      </figcaption>
    </figure>
  );
}
