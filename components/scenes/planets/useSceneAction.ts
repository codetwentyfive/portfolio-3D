"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";

import { isModelTap } from "./model-tap";

export type SceneActionProps = { actionKey: number; animateInteractions: boolean };

export function useSceneAction(actionKey: number, duration = 2.4, onStart?: () => void) {
  const { gl, invalidate } = useThree();
  const active = useRef(false);
  const progress = useRef(1);
  const previous = useRef(actionKey);
  const callback = useRef(onStart);
  callback.current = onStart;
  const start = useCallback(() => {
    active.current = true;
    progress.current = 0;
    callback.current?.();
    invalidate();
  }, [invalidate]);
  useEffect(() => {
    if (previous.current !== actionKey) start();
    previous.current = actionKey;
  }, [actionKey, start]);
  useEffect(() => {
    const stop = () => { active.current = false; progress.current = 1; invalidate(); };
    const hidden = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      gl.domElement.style.cursor = "";
    };
  }, [gl, invalidate]);
  useFrame((_, delta) => {
    if (!active.current) return;
    progress.current = Math.min(1, progress.current + Math.min(delta, .05) / duration);
    if (progress.current >= 1) active.current = false;
    invalidate();
  });
  const handlers = {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      // A model drag must never trigger its click action.
      if (event.delta > 6 || event.button !== 0 || !isModelTap(gl.domElement)) return;
      event.stopPropagation();
      start();
    },
    onPointerOver: () => { gl.domElement.style.cursor = "pointer"; },
    onPointerOut: () => { gl.domElement.style.cursor = ""; },
  };
  return { start, active, progress, handlers };
}
