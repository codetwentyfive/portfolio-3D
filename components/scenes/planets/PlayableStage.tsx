"use client";

/* eslint-disable react/no-unknown-property */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { createStageAudio } from "./stage-audio";
import { isModelTap } from "./model-tap";

export type StageInstrument = "handpan" | "xylophone" | "bell";
export type StageTarget = "kick" | "snare" | "cymbal" | "guitar" | "extra";
export type StageHandle = { play: (target: StageTarget) => void };

type Point = [number, number, number];
type Spot = {
  id: string;
  target: StageTarget;
  position: Point;
  size: Point;
  feedback: Point;
  radius: number;
  upright?: boolean;
  note?: number;
};

// Author coordinates from seeds(); these sit inside ProjectDiorama's centering group.
const SPOTS: Spot[] = [
  { id: "kick", target: "kick", position: [0, .96, -.02], size: [.8, .8, .15], feedback: [0, .96, .058], radius: .30, upright: true },
  { id: "tom-0", target: "snare", position: [-.28, 1.52, -.48], size: [.39, .27, .39], feedback: [-.28, 1.651, -.48], radius: .145, note: 3 },
  { id: "tom-1", target: "snare", position: [.28, 1.56, -.62], size: [.41, .27, .41], feedback: [.28, 1.691, -.62], radius: .15, note: 4 },
  { id: "tom-2", target: "snare", position: [.72, .98, -.78], size: [.47, .27, .47], feedback: [.72, 1.111, -.78], radius: .175, note: 1 },
  { id: "tom-3", target: "snare", position: [-.69, .95, -.02], size: [.43, .27, .43], feedback: [-.69, 1.081, -.02], radius: .16, note: 0 },
  { id: "cymbal-0", target: "cymbal", position: [-.98, 1.84, -.95], size: [.59, .15, .59], feedback: [-.98, 1.869, -.95], radius: .225 },
  { id: "cymbal-1", target: "cymbal", position: [.94, 1.92, -.97], size: [.63, .15, .63], feedback: [.94, 1.949, -.97], radius: .24 },
  { id: "cymbal-2", target: "cymbal", position: [-.99, 1.39, .29], size: [.45, .15, .45], feedback: [-.99, 1.419, .29], radius: .17 },
  { id: "guitar", target: "guitar", position: [1.35, 1.27, .54], size: [.55, 1.49, .17], feedback: [1.35, .9, .607], radius: .17, upright: true },
];
const PRIMARY: Record<Exclude<StageTarget, "extra">, string> = {
  kick: "kick", snare: "tom-3", cymbal: "cymbal-0", guitar: "guitar",
};
const NO_RAYCAST = () => {};
const HANDPAN_PROFILE = [[0, 0], [.11, 0], [.19, .03], [.205, .05], [.19, .08], [.16, .108], [.11, .135], [.055, .15], [0, .154]]
  .map(([radius, height]) => new THREE.Vector2(radius, height));
type FeedbackMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

type Props = {
  motion: boolean;
  extraInstrument?: StageInstrument | null;
  soundEnabled?: boolean;
  onPlayed?: (target: StageTarget) => void;
  model?: THREE.Object3D;
};

const PlayableStage = forwardRef<StageHandle, Props>(function PlayableStage({
  motion, extraInstrument = null, soundEnabled = true, onPlayed, model,
}, ref) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const audio = useRef<ReturnType<typeof createStageAudio> | null>(null);
  const feedback = useRef(new Map<string, FeedbackMesh>());
  const strikes = useRef(new Map<string, number>());
  const instrument = useRef<THREE.Group>(null);
  const noteCounter = useRef(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const cymbals = useMemo(() => [0, 1, 2].flatMap((index) => {
    const pivot = model?.getObjectByName(`cymbal_${index}`);
    return pivot ? [{ id: `cymbal-${index}`, pivot, baseX: pivot.rotation.x }] : [];
  }), [model]);

  useEffect(() => {
    const controller = createStageAudio();
    audio.current = controller;
    return () => { audio.current = null; controller.dispose(); };
  }, []);
  useEffect(() => { audio.current?.setEnabled(soundEnabled); }, [soundEnabled]);
  useEffect(() => {
    if (!hovered) return;
    const previous = canvas.style.cursor;
    canvas.style.cursor = "pointer";
    return () => { if (canvas.style.cursor === "pointer") canvas.style.cursor = previous; };
  }, [canvas, hovered]);
  useEffect(() => {
    strikes.current.delete("extra");
    noteCounter.current = 0;
    setHovered(null);
  }, [extraInstrument]);
  useEffect(() => () => {
    cymbals.forEach(({ pivot, baseX }) => { pivot.rotation.x = baseX; });
  }, [cymbals]);

  const strike = useCallback((target: StageTarget, id: string, note = 0) => {
    if (target === "extra" && !extraInstrument) return;
    strikes.current.set(id, performance.now() / 1000);
    invalidate();
    if (soundEnabled) void audio.current?.play(target === "extra" ? extraInstrument! : target, note);
    onPlayed?.(target);
  }, [extraInstrument, soundEnabled, onPlayed, invalidate]);

  useImperativeHandle(ref, () => ({
    play(target) {
      if (target === "extra") strike(target, "extra", noteCounter.current++);
      else strike(target, PRIMARY[target]);
    },
  }), [strike]);

  function pointer(id: string, target: StageTarget, note = 0) {
    return {
      onClick(event: ThreeEvent<MouseEvent>) {
        // A turntable drag can end over an instrument; it must not also play it.
        if (event.button !== 0 || event.delta > 5 || !isModelTap(canvas)) return;
        event.stopPropagation();
        strike(target, id, note);
      },
      onPointerOver(event: ThreeEvent<PointerEvent>) {
        event.stopPropagation();
        setHovered(id);
        invalidate();
      },
      onPointerOut() {
        setHovered((current) => current === id ? null : current);
        invalidate();
      },
    };
  }

  useFrame(() => {
    const now = performance.now() / 1000;
    let active = false;
    for (const [id, mesh] of feedback.current) {
      const started = strikes.current.get(id);
      const elapsed = started === undefined ? Infinity : now - started;
      const duration = motion ? .48 : .22;
      const playing = elapsed < duration;
      const hovering = hovered === id;
      mesh.visible = playing || hovering;
      mesh.material.opacity = playing ? (motion ? .72 * (1 - elapsed / duration) : .65) : .16;
      mesh.scale.setScalar(playing && motion ? 1 + Math.sin(elapsed / duration * Math.PI) * .13 : 1);
      // Local cymbal shimmer moves only when struck; the stage remains steady.
      if (id.startsWith("cymbal")) mesh.rotation.y = playing && motion ? Math.sin(elapsed * 38) * .13 * (1 - elapsed / duration) : 0;
      if (playing) active = true;
      else if (started !== undefined) strikes.current.delete(id);
    }
    for (const { id, pivot, baseX } of cymbals) {
      const start = strikes.current.get(id);
      const elapsed = start === undefined ? Infinity : now - start;
      const playing = elapsed < .48;
      // Preserve the generator's pivot and any separate ambient Z sway.
      pivot.rotation.x = baseX + (playing && motion ? Math.sin(elapsed * 43) * .11 * (1 - elapsed / .48) : 0);
    }
    const extraStarted = strikes.current.get("extra");
    const extraTime = extraStarted === undefined ? Infinity : now - extraStarted;
    if (instrument.current) {
      const playing = extraTime < .48;
      instrument.current.rotation.z = playing && motion && extraInstrument !== "xylophone" ? Math.sin(extraTime * 35) * .055 * (1 - extraTime / .48) : 0;
      if (extraInstrument === "xylophone") instrument.current.position.y = playing && motion ? Math.abs(Math.sin(extraTime * 35)) * .008 * (1 - extraTime / .48) : 0;
      if (playing) active = true;
    }
    // Demand-rendered/reduced-motion scenes need only the short feedback interval.
    if (active) invalidate();
  });

  return (
    <group>
      {SPOTS.map((spot) => (
        <group key={spot.id}>
          <mesh position={spot.position} {...pointer(spot.id, spot.target, spot.note)}>
            <boxGeometry args={spot.size} />
            <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
          </mesh>
          <mesh
            ref={(mesh) => { if (mesh) feedback.current.set(spot.id, mesh as FeedbackMesh); else feedback.current.delete(spot.id); }}
            position={spot.feedback}
            rotation={spot.upright ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}
            visible={false}
            raycast={NO_RAYCAST}
            renderOrder={2}
          >
            <ringGeometry args={[spot.radius * .84, spot.radius, 32]} />
            <meshBasicMaterial color="#ffe3a0" transparent opacity={0} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {extraInstrument && (
        <group position={[-2.31, 0, .65]}>
          <mesh position={[0, .225, 0]} castShadow receiveShadow>
            <boxGeometry args={[.40, .37, .40]} />
            <meshStandardMaterial color="#35443e" roughness={.9} />
          </mesh>
          <mesh position={[0, .44, 0]} castShadow receiveShadow>
            <boxGeometry args={[.44, .06, .44]} />
            <meshStandardMaterial color="#a18c60" roughness={.76} />
          </mesh>
          <mesh position={[0, .28, .202]}>
            <boxGeometry args={[.06, .09, .006]} />
            <meshStandardMaterial color="#b19c6b" roughness={.65} />
          </mesh>
          <group position={[0, .47, 0]}>
            {extraInstrument === "handpan" && (
              <group ref={instrument} {...pointer("extra", "extra", 0)}>
                <mesh castShadow>
                  <latheGeometry args={[HANDPAN_PROFILE, 32]} />
                  <meshStandardMaterial color="#477b7b" metalness={.6} roughness={.32} />
                </mesh>
                <mesh position={[0, .151, 0]} scale={[1, .15, 1]}>
                  <sphereGeometry args={[.045, 16, 8]} />
                  <meshStandardMaterial color="#ba9656" metalness={.55} roughness={.37} />
                </mesh>
                {Array.from({ length: 6 }, (_, index) => {
                  const angle = index * Math.PI / 3;
                  return (
                    <mesh key={index} position={[Math.cos(angle) * .132, .124, Math.sin(angle) * .132]} rotation={[0, -angle, -Math.atan(.54)]} scale={[1, .16, 1]} {...pointer("extra", "extra", index + 1)}>
                      <sphereGeometry args={[.034, 16, 8]} />
                      <meshStandardMaterial color="#86a7a0" metalness={.5} roughness={.42} />
                    </mesh>
                  );
                })}
              </group>
            )}
            {extraInstrument === "xylophone" && (
              <group>
                {[-.08, .08].map((x) => <mesh key={x} position={[x, .03, 0]} castShadow><boxGeometry args={[.035, .06, .36]} /><meshStandardMaterial color="#49372b" roughness={.85} /></mesh>)}
                <group ref={instrument}>
                {Array.from({ length: 7 }, (_, index) => (
                  <mesh key={index} position={[0, .078, -.15 + index * .05]} castShadow {...pointer("extra", "extra", index)}>
                    <boxGeometry args={[.38 - index * .024, .037, .04]} />
                    <meshStandardMaterial color={index % 2 ? "#9d653f" : "#c08e55"} roughness={.55} />
                  </mesh>
                ))}
                </group>
              </group>
            )}
            {extraInstrument === "bell" && (
              <group>
                {[-.17, .17].map((x) => <mesh key={x} position={[x, .23, 0]} castShadow><boxGeometry args={[.035, .46, .05]} /><meshStandardMaterial color="#674934" roughness={.78} /></mesh>)}
                <mesh position={[0, .46, 0]} castShadow><boxGeometry args={[.41, .045, .065]} /><meshStandardMaterial color="#674934" roughness={.78} /></mesh>
                <group ref={instrument} position={[0, .42, 0]} {...pointer("extra", "extra", 0)}>
                  <mesh position={[0, -.115, 0]} castShadow><coneGeometry args={[.112, .19, 20, 1, true]} /><meshStandardMaterial color="#b7995c" metalness={.7} roughness={.32} side={THREE.DoubleSide} /></mesh>
                  <mesh position={[0, -.212, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.112, .011, 8, 24]} /><meshStandardMaterial color="#b7995c" metalness={.7} roughness={.32} /></mesh>
                  <mesh position={[0, -.22, 0]}><sphereGeometry args={[.022, 12, 8]} /><meshStandardMaterial color="#453f32" metalness={.55} roughness={.5} /></mesh>
                  <mesh position={[0, -.12, 0]}><cylinderGeometry args={[.005, .005, .20, 8]} /><meshStandardMaterial color="#453f32" metalness={.55} roughness={.5} /></mesh>
                  <mesh><cylinderGeometry args={[.009, .009, .07, 8]} /><meshStandardMaterial color="#5c5745" metalness={.5} roughness={.65} /></mesh>
                </group>
              </group>
            )}
          </group>
          <mesh
            ref={(mesh) => { if (mesh) feedback.current.set("extra", mesh as FeedbackMesh); else feedback.current.delete("extra"); }}
            position={[0, .476, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            raycast={NO_RAYCAST}
          >
            <ringGeometry args={[.19, .21, 32]} />
            <meshBasicMaterial color="#ffe3a0" transparent opacity={0} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default PlayableStage;
