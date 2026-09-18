"use client";

/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { PlanetKind } from "./planet-data";
import worldVersions from "@/assets/world-versions.json";
import MatrixDisplay from "./MatrixDisplay";
import PoteraCleaning from "./PoteraCleaning";
import PlayableStage, { type StageHandle, type StageInstrument } from "./PlayableStage";
import { useSceneAction, type SceneActionProps } from "./useSceneAction";

type DioramaKind = Exclude<PlanetKind, "shop" | "portfolio">;

export default function ProjectDiorama({
  kind,
  motion, actionKey, animateInteractions, stageRef, extraInstrument, soundEnabled, onStagePlayed,
}: {
  kind: DioramaKind;
  motion: boolean;
  stageRef: RefObject<StageHandle>;
  extraInstrument: StageInstrument | null;
  soundEnabled: boolean;
  onStagePlayed: () => void;
} & SceneActionProps) {
  const [replayKey, setReplayKey] = useState(0);
  const action = useSceneAction(kind === "potera" ? 0 : actionKey, 2.4, () => setReplayKey((key) => key + 1));
  const effect = useRef<THREE.Group>(null);
  const { scene } = useGLTF(`/3d/worlds/${kind}-v${worldVersions[kind]}.glb`);
  const elapsed = useRef(0);
  const gl = useThree((state) => state.gl);
  const { model, mechanisms, center, scale, artworkMaterials, artworkTextures } = useMemo(() => {
    const model = scene.clone(true);
    const mechanisms: THREE.Object3D[] = [];
    const artworkMaterials: THREE.MeshStandardMaterial[] = [];
    const artworkTextures: THREE.Texture[] = [];
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const artwork = !Array.isArray(object.material) &&
          object.material.name.endsWith("official logo");
        const fineSeams = !Array.isArray(object.material) && object.material.name === "Potera fine roof seams";
        object.castShadow = !artwork && !fineSeams && !(
          !Array.isArray(object.material) &&
          object.material.name === "Room cabinet glass"
        );
        if (artwork) {
          const material = (object.material as THREE.MeshStandardMaterial).clone();
          material.alphaToCoverage = true;
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1;
          material.polygonOffsetUnits = -1;
          if (material.map) {
            material.map = material.map.clone();
            material.map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
            artworkTextures.push(material.map);
          }
          object.material = material;
          artworkMaterials.push(material);
        }
        // Thin printed artwork must not receive biased shadows from its backing.
        object.receiveShadow = !artwork && !fineSeams;
      } else if (/^(parcel|fan|reel|cymbal)_/.test(object.name)) {
        mechanisms.push(object);
      }
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 6 / Math.max(size.x, size.y, size.z);
    return { model, mechanisms, center, scale, artworkMaterials, artworkTextures };
  }, [scene, gl]);
  useEffect(() => () => {
    artworkMaterials.forEach((material) => material.dispose());
    artworkTextures.forEach((texture) => texture.dispose());
  }, [artworkMaterials, artworkTextures]);

  useFrame((_, delta) => {
    if (effect.current) {
      effect.current.visible = action.active.current;
    }
    const burst = action.active.current && animateInteractions;
    if (!motion && !burst) return;
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt * (kind === "payments" && burst ? 3.5 : 1);
    mechanisms.forEach((part, index) => {
      if (part.name.startsWith("parcel_")) {
        const offset = Number(part.name.split("_")[1]) * (3.76 / 3);
        // Keep the full parcel footprint supported by the conveyor at both ends.
        part.position.x = -1.88 + ((elapsed.current * 0.3 + offset) % 3.76);
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
    <group scale={kind === "potera" ? scale : 1}>
      <group position={[-center.x, -center.y, -center.z]}>
      {kind === "potera" ? <PoteraCleaning model={model} actionKey={actionKey} animateInteractions={animateInteractions} /> : <primitive object={model} dispose={null} {...(kind === "seeds" ? {
        onClick: (event: ThreeEvent<MouseEvent>) => event.stopPropagation(),
        onPointerOver: (event: ThreeEvent<PointerEvent>) => event.stopPropagation(),
      } : action.handlers)} />}
      {kind === "seeds" && <PlayableStage model={model} ref={stageRef} motion={animateInteractions} extraInstrument={extraInstrument} soundEnabled={soundEnabled} onPlayed={onStagePlayed} />}
      {kind === "payments" && <group ref={effect} visible={false} position={[.2, 1.02, .95]}>
        <mesh><boxGeometry args={[.016, .55, .64]} /><meshBasicMaterial color="#b0ffcf" transparent opacity={.18} depthWrite={false} /></mesh>
        <pointLight color="#9cffba" intensity={.8} distance={1.4} />
      </group>}
      {kind === "assistant" && (
        <>
          <MatrixDisplay model={model} motion={motion} replayKey={replayKey} animateInteractions={animateInteractions} />
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
    </group>
  );
}
