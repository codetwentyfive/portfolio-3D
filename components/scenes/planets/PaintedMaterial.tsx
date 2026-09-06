"use client";

/* eslint-disable react/no-unknown-property */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MeshStandardMaterial } from "three";
import type { GerStyle } from "./planet-data";

type Shader = Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];

export function PaintedMaterial({
  color,
  style = "paint",
  animated = false,
  motion = true,
}: {
  color: string;
  style?: GerStyle;
  animated?: boolean;
  motion?: boolean;
}) {
  const shader = useRef<Shader | null>(null);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (motion) time.current += Math.min(delta, 0.05);
    if (shader.current) {
      shader.current.uniforms.uPaintTime.value = time.current;
      shader.current.uniforms.uGlitch.value =
        animated && style === "paint" && motion ? 1 : 0;
    }
  });

  return (
    <meshStandardMaterial
      key={style}
      color={
        style === "blueprint"
          ? "#2e6386"
          : style === "alloy"
            ? "#c8d7ce"
            : style === "clay"
              ? "#cb896d"
              : color
      }
      metalness={style === "alloy" ? 0.87 : 0.03}
      envMapIntensity={style === "alloy" ? 1.2 : 0.3}
      roughness={style === "alloy" ? 0.2 : 0.88}
      transparent={style === "blueprint"}
      opacity={style === "blueprint" ? 0.18 : 1}
      depthWrite={style !== "blueprint"}
      onBeforeCompile={(compiled) => {
        shader.current = compiled;
        compiled.uniforms.uPaintTime = { value: time.current };
        compiled.uniforms.uGlitch = { value: 0 };
        compiled.vertexShader = `varying vec3 vBrushPosition; uniform float uPaintTime; uniform float uGlitch;\n${compiled.vertexShader}`;
        compiled.vertexShader = compiled.vertexShader.replace(
          "#include <begin_vertex>",
          `
          #include <begin_vertex>
          vBrushPosition = position;
          float beat = mod(uPaintTime, 5.6);
          float smear = step(5.22, beat) * (1.0 - step(5.52, beat)) * uGlitch;
          float band = floor(position.y * 16.0);
          transformed.x += sin(band * 17.0 + floor(uPaintTime * 16.0)) * smear * 0.16;
        `,
        );
        compiled.fragmentShader = `varying vec3 vBrushPosition; uniform float uPaintTime; uniform float uGlitch;\n${compiled.fragmentShader}`;
        compiled.fragmentShader = compiled.fragmentShader.replace(
          "#include <color_fragment>",
          `
          #include <color_fragment>
          vec3 p = vBrushPosition;
          float stroke = sin(p.x * 34.0 + sin(p.y * 28.0) * 2.0 + p.z * 23.0);
          float wash = sin(p.x * 6.0 + p.y * 9.0) * sin(p.z * 8.0 - p.y * 4.0);
          float grain = fract(sin(dot(floor(p * 240.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          diffuseColor.rgb *= 0.92 + stroke * 0.035 + floor(wash * 4.0) * 0.033 + grain * 0.055;
          float beat = mod(uPaintTime, 5.6);
          float flash = step(5.22, beat) * (1.0 - step(5.52, beat)) * uGlitch;
          float band = step(0.4, sin(floor(p.y * 16.0) * 8.0 + floor(uPaintTime * 16.0)));
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.09, 0.78, 0.76), vec3(0.91, 0.26, 0.13), band), flash * 0.48);
        `,
        );
      }}
      customProgramCacheKey={() => "steppe-painted-v1"}
    />
  );
}
