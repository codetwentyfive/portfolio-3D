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
}: {
  model: THREE.Object3D;
  motion: boolean;
}) {
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

  useFrame((_, delta) => {
    const current = display.current;
    if (!current || !advanceMatrixRain(current.rain, delta, motion)) return;
    paintMatrixRain(current.context, current.rain);
    current.texture.needsUpdate = true;
  });
  return null;
}
