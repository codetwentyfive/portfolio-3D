"use client";

import { useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GerStyle } from "./planet-data";

/** Convert Blender's exported V back to downstream distance; U spans the banks. */
export default function SteppeWater({ model, motion, style }: {
  model: THREE.Object3D;
  motion: boolean;
  style: GerStyle;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const uniforms = useMemo(() => ({
    steppeTime: { value: 0 },
    steppeNatural: { value: 1 },
    steppeDeep: { value: new THREE.Color("#426b70") },
    steppeShallow: { value: new THREE.Color("#a1b3a1") },
  }), []);

  useLayoutEffect(() => {
    // ShopSteppe owns these material clones. Cached GLTF materials stay untouched.
    const water = new Set<THREE.MeshStandardMaterial>();
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial && material.name === "Steppe_river_water") water.add(material);
      });
    });
    const restore = [...water].map((material) => {
      const previousCompile = material.onBeforeCompile;
      const previousCacheKey = material.customProgramCacheKey;
      material.onBeforeCompile = (shader, renderer) => {
        previousCompile.call(material, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec2 vSteppeUv;")
          .replace("#include <uv_vertex>", "#include <uv_vertex>\nvSteppeUv = vec2(uv.x, 1.0 - uv.y);");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec2 vSteppeUv;
            uniform float steppeTime;
            uniform float steppeNatural;
            uniform vec3 steppeDeep;
            uniform vec3 steppeShallow;
            float steppeWave(vec2 p) {
              float along = p.y * 7.0 - steppeTime * .48;
              return sin(along + sin(p.x * 9.0 + p.y * 2.2) * .65) * .006
                + sin(p.x * 26.0 + p.y * 12.0 - steppeTime * .71) * .0025;
            }
          `)
          .replace("#include <color_fragment>", `#include <color_fragment>
            float bank = abs(vSteppeUv.x - .5) * 2.0;
            float shallow = smoothstep(.30, 1.0, bank);
            float current = sin(vSteppeUv.y * 5.4 - steppeTime * .24 + sin(vSteppeUv.x * 8.0));
            vec3 riverColor = mix(steppeDeep, steppeShallow, shallow * .82);
            riverColor *= 1.0 + current * .045;
            diffuseColor.rgb = mix(diffuseColor.rgb, riverColor, steppeNatural);
          `)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            roughnessFactor = mix(roughnessFactor, mix(.24, .43, shallow), steppeNatural);
          `)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            float ripple = steppeWave(vSteppeUv) * (1.0 - shallow * .7) * steppeNatural;
            vec3 riverDx = dFdx(-vViewPosition);
            vec3 riverDy = dFdy(-vViewPosition);
            vec3 riverR1 = cross(riverDy, normal);
            vec3 riverR2 = cross(normal, riverDx);
            float riverDet = dot(riverDx, riverR1);
            vec3 riverGradient = sign(riverDet) * (dFdx(ripple) * riverR1 + dFdy(ripple) * riverR2);
            normal = normalize(max(abs(riverDet), .0000001) * normal - riverGradient);
          `);
      };
      material.customProgramCacheKey = () => "steppe-river-v7";
      material.needsUpdate = true;
      return () => {
        material.onBeforeCompile = previousCompile;
        material.customProgramCacheKey = previousCacheKey;
        material.needsUpdate = true;
      };
    });
    invalidate();
    return () => restore.forEach((restoreMaterial) => restoreMaterial());
  }, [model, uniforms, invalidate]);

  useLayoutEffect(() => {
    uniforms.steppeNatural.value = style === "paint" ? 1 : 0;
    invalidate();
  }, [style, uniforms, invalidate]);

  useFrame((_, delta) => {
    if (!motion || style !== "paint" || document.hidden) return;
    uniforms.steppeTime.value += Math.min(delta, .05);
    invalidate();
  });

  return null;
}
