"use client";

/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Center,
  Environment,
  Lightformer,
  Resize,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import ShopSteppe from "./ShopSteppe";
import type { StageHandle, StageInstrument } from "./PlayableStage";
import { useSceneAction, type SceneActionProps } from "./useSceneAction";
import ProjectDiorama from "./ProjectDiorama";
import { planets, type GerStyle } from "./planet-data";
import WorldTurntable from "./WorldTurntable";
import WorldPreparation from "./WorldPreparation";

function OriginalIsland({ actionKey, animateInteractions }: SceneActionProps) {
  const rotation = useRef<THREE.Group>(null);
  const action = useSceneAction(actionKey, 2.2);
  useFrame(() => {
    if (rotation.current) {
      const p = action.progress.current;
      rotation.current.rotation.y = animateInteractions && action.active.current ? (p * p * (3 - 2 * p)) * Math.PI * 2 : 0;
      rotation.current.scale.setScalar(!animateInteractions && action.active.current ? 1.015 : 1);
    }
  });
  const { scene } = useGLTF("/3d/island.glb");
  const island = useMemo(() => {
    const clone = scene.clone(true);
    const materials = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const relight = (source: THREE.MeshStandardMaterial) => {
        if (!materials.has(source)) {
          const material = source.clone();
          // The legacy atlas was also connected to emission at full intensity.
          material.emissive.set(0x000000);
          material.emissiveIntensity = 0;
          material.emissiveMap = null;
          material.metalness = 0;
          material.roughness = 0.8;
          material.envMapIntensity = 0.28;
          materials.set(source, material);
        }
        return materials.get(source)!;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(relight)
        : relight(object.material);
    });
    return { clone, materials: [...materials.values()] };
  }, [scene]);
  useEffect(
    () => () => island.materials.forEach((material) => material.dispose()),
    [island],
  );
  return (
    <group ref={rotation} {...action.handlers}>
    <Center>
      <Resize scale={6}>
        <primitive object={island.clone} dispose={null} />
      </Resize>
    </Center>
    </group>
  );
}

type PlayProps = SceneActionProps & {
  stageRef: RefObject<StageHandle>;
  extraInstrument: StageInstrument | null;
  soundEnabled: boolean;
  onStagePlayed: () => void;
};

function World({
  index,
  style,
  motion,
  ...play
}: {
  index: number;
  style: GerStyle;
  motion: boolean;
} & PlayProps) {
  const kind = planets[index].kind;
  return (
    <group>
      {kind === "shop" ? (
        <ShopSteppe style={style} motion={motion} actionKey={play.actionKey} animateInteractions={play.animateInteractions} />
      ) : kind === "portfolio" ? (
        <OriginalIsland actionKey={play.actionKey} animateInteractions={play.animateInteractions} />
      ) : (
        <ProjectDiorama kind={kind} motion={motion} {...play} />
      )}
    </group>
  );
}

export default function PlanetCanvas({
  index,
  style,
  motion,
  resetKey,
  orbitStep,
  fallbackText,
  onHoldChange,
  interactionLabel,
  zoomed,
  prepareIndex,
  onPrepared,
  ...play
}: {
  index: number;
  style: GerStyle;
  motion: boolean;
  resetKey: number;
  orbitStep: number;
  fallbackText: string;
  onHoldChange: (held: boolean) => void;
  interactionLabel: string;
  zoomed: boolean;
  prepareIndex: number | null;
  onPrepared: (index: number) => void;
} & PlayProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2") || probe.getContext("webgl");
    setAvailable(Boolean(context));
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);
  useEffect(() => {
    // The text/project navigator must still work when WebGL is unavailable.
    if (available === false && prepareIndex !== null) onPrepared(prepareIndex);
  }, [available, prepareIndex, onPrepared]);
  const canvasElement = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    canvasElement.current?.setAttribute("aria-label", interactionLabel);
  }, [interactionLabel]);
  const loseContext = useRef((event: Event) => {
    event.preventDefault();
    setAvailable(false);
  });
  useEffect(() => {
    const handler = loseContext.current;
    return () => {
      canvasElement.current?.removeEventListener("webglcontextlost", handler);
    };
  }, []);

  if (!available)
    return (
      <div
        className="flex h-full items-center justify-center px-10 text-center text-sm text-slate-600"
        role="status"
      >
        {available === false ? (
          fallbackText
        ) : (
          <span className="h-8 w-8 animate-pulse rounded-full border border-slate-300 motion-reduce:animate-none" />
        )}
      </div>
    );
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.5]}
      frameloop={motion ? "always" : "demand"}
      camera={{ position: [5.8, 4.3, 8.7], fov: 38, near: 0.1, far: 70 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95,
      }}
      onCreated={({ gl }) => {
        canvasElement.current = gl.domElement;
        gl.domElement.tabIndex = 0;
        gl.domElement.setAttribute("role", "img");
        gl.domElement.setAttribute("aria-label", interactionLabel);
        gl.domElement.addEventListener("webglcontextlost", loseContext.current);
        gl.setClearColor(0x000000, 0);
      }}
    >
      {prepareIndex !== null && (
        <WorldPreparation index={prepareIndex} onPrepared={onPrepared} />
      )}
      <ambientLight intensity={0.08} />
      <hemisphereLight args={["#b9d8e8", "#4c513b", 0.55]} />
      <directionalLight
        position={[-3.5, 7, 5]}
        intensity={3.6}
        color="#ffe6c1"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.1}
        shadow-camera-far={25}
        shadow-bias={-0.00015}
        shadow-normalBias={0.024}
      />
      <directionalLight position={[4, 3, -5]} intensity={1.5} color="#b8daed" />
      <directionalLight position={[5, 2, 5]} intensity={0.35} color="#e4f0ed" />
      <directionalLight
        position={[1, -4, 4]}
        intensity={0.75}
        color="#b6c4ad"
      />
      <Environment resolution={128} frames={1}>
        <Lightformer
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
          intensity={1.1}
          color="#e3edf3"
        />
        <Lightformer
          position={[-5, 1, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[3, 8, 1]}
          intensity={1.8}
          color="#fff1d9"
        />
      </Environment>
      <WorldTurntable
        zoomed={zoomed}
        index={index}
        resetKey={resetKey}
        orbitStep={orbitStep}
        motion={motion}
        onHoldChange={onHoldChange}
      >
        <World key={index} index={index} style={style} motion={motion} {...play} />
      </WorldTurntable>
    </Canvas>
  );
}
