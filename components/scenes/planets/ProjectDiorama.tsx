"use client";

/* eslint-disable react/no-unknown-property */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { PlanetKind } from "./planet-data";
import worldVersions from "@/assets/world-versions.json";
import MatrixDisplay from "./MatrixDisplay";

type DioramaKind = Exclude<PlanetKind, "shop" | "portfolio">;

export default function ProjectDiorama({
  kind,
  motion,
}: {
  kind: DioramaKind;
  motion: boolean;
}) {
  const { scene } = useGLTF(`/3d/worlds/${kind}-v${worldVersions[kind]}.glb`);
  const elapsed = useRef(0);
  const { model, mechanisms } = useMemo(() => {
    const model = scene.clone(true);
    const mechanisms: THREE.Object3D[] = [];
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = !(
          !Array.isArray(object.material) &&
          object.material.name === "Room cabinet glass"
        );
        object.receiveShadow = true;
      } else if (/^(parcel|fan|reel|cymbal)_/.test(object.name)) {
        mechanisms.push(object);
      }
    });
    return { model, mechanisms };
  }, [scene]);

  useFrame((_, delta) => {
    if (!motion) return;
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt;
    mechanisms.forEach((part, index) => {
      if (part.name.startsWith("parcel_")) {
        const offset = Number(part.name.split("_")[1]) * 1.4;
        part.position.x = -2.1 + ((elapsed.current * 0.3 + offset) % 4.2);
      } else if (part.name.startsWith("fan_")) {
        part.rotation.x += dt * 2.5;
      } else if (part.name.startsWith("reel_")) {
        part.rotation.z -= dt * 0.45;
      } else {
        part.rotation.z = Math.sin(elapsed.current * 2.2 + index) * 0.025;
      }
    });
  });

  // Loader-owned geometry/materials stay cached; each placement owns its transforms.
  return (
    <group position={[0, kind === "assistant" ? -1.15 : -0.55, 0]}>
      <primitive object={model} dispose={null} />
      {kind === "assistant" && (
        <>
          <MatrixDisplay model={model} motion={motion} />
          <pointLight
            position={[0, 1.6, 0.05]}
            color="#76efb0"
            intensity={0.75}
            distance={3.2}
            decay={2}
          />
        </>
      )}
    </group>
  );
}
