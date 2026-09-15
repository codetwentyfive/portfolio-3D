"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  MATRIX_WIDTH,
  MATRIX_HEIGHT,
  createMatrixRain,
  advanceMatrixRain,
  paintMatrixRain,
  type MatrixRain,
} from "./matrix-rain";

export default function MatrixDisplay({
  model,
  motion,
  replayKey = 0,
  animateInteractions = true,
}: {
  model: THREE.Object3D;
  motion: boolean;
  replayKey?: number;
  animateInteractions?: boolean;
}) {
  const burst = useRef(0);
  const handledReplay = useRef(replayKey);
  const invalidate = useThree((state) => state.invalidate);
  const display = useRef<{
    texture: THREE.CanvasTexture;
    context: CanvasRenderingContext2D;
    rain: MatrixRain;
  } | null>(null);

  useEffect(() => {
    let screen: THREE.Mesh | undefined;
    model.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        !Array.isArray(object.material) &&
        object.material.name === "Room OLED screen"
      ) screen = object;
    });
    if (!screen) return;
    const target = screen;
    const canvas = document.createElement("canvas");
    canvas.width = MATRIX_WIDTH;
    canvas.height = MATRIX_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rain = createMatrixRain();
    paintMatrixRain(context, rain);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    // Match the exported glTF UV orientation, not Three's default canvas origin.
    texture.flipY = false;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const original = target.material;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    });
    material.name = "Live matrix display";
    target.material = material;
    display.current = { texture, context, rain };
    invalidate();
    return () => {
      display.current = null;
      target.material = original;
      material.dispose();
      texture.dispose();
    };
  }, [model, invalidate]);

  useEffect(() => {
    if (handledReplay.current === replayKey || !display.current) return;
    handledReplay.current = replayKey;
    burst.current = animateInteractions ? 2.4 : 0;
    if (!animateInteractions) {
      advanceMatrixRain(display.current.rain, .15, true);
      paintMatrixRain(display.current.context, display.current.rain);
      display.current.texture.needsUpdate = true;
    }
    invalidate();
  }, [replayKey, animateInteractions, invalidate]);

  useEffect(() => {
    if (!animateInteractions) burst.current = 0;
  }, [animateInteractions]);

  useFrame((_, delta) => {
    const current = display.current;
    const running = burst.current > 0 && animateInteractions;
    if (running) { burst.current -= Math.min(delta, .05); invalidate(); }
    if (!current || !advanceMatrixRain(current.rain, delta * (running ? 3 : 1), motion || running)) return;
    paintMatrixRain(current.context, current.rain);
    current.texture.needsUpdate = true;
  });
  return null;
}
