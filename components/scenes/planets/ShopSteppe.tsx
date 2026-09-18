"use client";

/* eslint-disable react/no-unknown-property */
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import worldVersions from "@/assets/world-versions.json";
import { isModelTap } from "./model-tap";
import type { GerStyle } from "./planet-data";
import SteppeWater from "./SteppeWater";
import { SheepAudio, type SheepNote } from "./sheep-audio";
import {
  SHEEP_COUNT, SHEEP_REACTION_DURATIONS,
  advanceSheepClocks, createSheepClocks, sampleSheepPose, startSheepReaction,
} from "./sheep-motion";

function sheepIndex(object: THREE.Object3D | null): number | null {
  while (object) {
    const match = /^sheep_(\d+)$/.exec(object.name);
    if (match) {
      const index = Number(match[1]);
      return index < SHEEP_COUNT ? index : null;
    }
    object = object.parent;
  }
  return null;
}

const REACTION_COLORS = ["#baa78a", "#bcc4ae", "#ceba96"];
const LEG_NAMES = ["front_left", "front_right", "back_left", "back_right"] as const;

export type SheepHandle = { play(index: number): void };

function bindJoint(model: THREE.Object3D, name: string) {
  const object = model.getObjectByName(name);
  return object ? {
    object, position: object.position.clone(), rotation: object.rotation.clone(), scale: object.scale.clone(),
  } : null;
}

function restoreJoint(joint: ReturnType<typeof bindJoint>) {
  if (!joint) return;
  joint.object.position.copy(joint.position);
  joint.object.rotation.copy(joint.rotation);
  joint.object.scale.copy(joint.scale);
}

export default function ShopSteppe({
  style, motion, animateInteractions, soundEnabled, sheepRef,
}: {
  style: GerStyle; motion: boolean; animateInteractions: boolean;
  soundEnabled: boolean; sheepRef: RefObject<SheepHandle | null>;
}) {
  const { scene } = useGLTF(`/3d/shop/steppe-v${worldVersions.shop}.glb`);
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const clocks = useRef(createSheepClocks());
  const feedbackTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const singingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const singing = useRef<(number | null)[]>(Array(SHEEP_COUNT).fill(null));
  const audio = useRef<SheepAudio | null>(null);
  const elapsed = useRef(0);
  const idleWeight = useRef(0);
  const hovered = useRef<number | null>(null);
  const hidden = useRef(false);
  const asset = useMemo(() => {
    const model = scene.clone(true);
    const materialCache = new Map<THREE.MeshStandardMaterial, Map<number | null, THREE.MeshStandardMaterial>>();
    const materials: { source: THREE.MeshStandardMaterial; material: THREE.MeshStandardMaterial; sheep: number | null }[] = [];
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const owner = sheepIndex(object);
      const sources: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
      // Fine stitching is smaller than a shadow-map texel; omit its self-shadow.
      const fineDetail = sources.every((source) => /flax_seam|felt_seam|water_glints/i.test(source.name));
      const river = sources.every((source) => source.name === "Steppe_river_water");
      object.castShadow = !fineDetail && !river;
      object.receiveShadow = !fineDetail;
      const clone = (source: THREE.MeshStandardMaterial) => {
        let bySheep = materialCache.get(source);
        if (!bySheep) { bySheep = new Map(); materialCache.set(source, bySheep); }
        if (!bySheep.has(owner)) {
          const material = source.clone();
          material.envMapIntensity = .35;
          bySheep.set(owner, material);
          materials.push({ source, material, sheep: owner });
        }
        return bySheep.get(owner)!;
      };
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const sheep = Array.from({ length: SHEEP_COUNT }, (_, index) => {
      const root = model.getObjectByName(`sheep_${index}`);
      const head = bindJoint(model, `sheep_head_${index}`);
      const body = bindJoint(model, `sheep_body_${index}`);
      if (!root || !head || !body) return null;
      const ears = [bindJoint(model, `sheep_ear_${index}_left`), bindJoint(model, `sheep_ear_${index}_right`)];
      const tail = bindJoint(model, `sheep_tail_${index}`);
      const jaw = bindJoint(model, `sheep_jaw_${index}`);
      const legs = LEG_NAMES.map((name) => bindJoint(model, `sheep_leg_${index}_${name}`));
      return {
        index, root, head, body, ears, tail, jaw, legs,
        position: root.position.clone(),
        joints: [head, body, ...ears, tail, jaw, ...legs],
        tint: new THREE.Color(REACTION_COLORS[index]),
      };
    }).filter((sheep): sheep is NonNullable<typeof sheep> => sheep !== null);
    return {
      model, materials, sheep,
      center: bounds.getCenter(new THREE.Vector3()),
      // The OG island is also fitted to a longest dimension of six units.
      scale: 6 / Math.max(size.x, size.y, size.z),
    };
  }, [scene]);

  const clearSinging = useCallback(() => {
    singingTimers.current.forEach(clearTimeout);
    singingTimers.current = [];
    singing.current.fill(null);
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    const controller = new SheepAudio();
    audio.current = controller;
    return () => { audio.current = null; controller.dispose(); };
  }, []);

  useEffect(() => {
    audio.current?.setEnabled(soundEnabled);
    if (!soundEnabled) clearSinging();
  }, [soundEnabled, clearSinging]);

  const onNote = useCallback((note: SheepNote) => {
    const index = note.sheepIndex;
    clearTimeout(singingTimers.current[index]);
    singing.current[index] = performance.now();
    singingTimers.current[index] = setTimeout(() => {
      singing.current[index] = null;
      invalidate();
    }, note.duration * 1000);
    invalidate();
  }, [invalidate]);

  const reset = useCallback(() => {
    clearSinging();
    feedbackTimers.current.forEach(clearTimeout);
    feedbackTimers.current = [];
    clocks.current.fill(-1);
    elapsed.current = 0;
    idleWeight.current = 0;
    hovered.current = null;
    for (const sheep of asset.sheep) {
      sheep.root.position.copy(sheep.position);
      sheep.joints.forEach(restoreJoint);
    }
    for (const { source, material } of asset.materials) material.emissive.copy(source.emissive);
    canvas.style.cursor = "";
    invalidate();
  }, [asset, canvas, clearSinging, invalidate]);

  const start = useCallback((index: number) => {
    if (document.hidden || !Number.isInteger(index) || index < 0 || index >= SHEEP_COUNT) return;
    // A sheep can sing the whole tune even while its longer body reaction is active.
    if (soundEnabled) void audio.current?.play(index, onNote);
    if (!startSheepReaction(clocks.current, index)) return;
    if (!animateInteractions) {
      // A static tint needs only the start/end frames under reduced motion.
      feedbackTimers.current[index] = setTimeout(() => {
        clocks.current[index] = -1;
        invalidate();
      }, SHEEP_REACTION_DURATIONS[index] * 1000);
    }
    invalidate();
  }, [animateInteractions, soundEnabled, onNote, invalidate]);

  useImperativeHandle(sheepRef, () => ({ play: start }), [start]);

  useEffect(() => {
    reset();
  }, [animateInteractions, reset]);

  useEffect(() => {
    const visibility = () => {
      hidden.current = document.hidden;
      if (hidden.current) { audio.current?.stop(); reset(); }
      else invalidate();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.target !== canvas || document.activeElement !== canvas || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || !/^[1-3]$/.test(event.key)) return;
      event.preventDefault();
      start(Number(event.key) - 1);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    canvas.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("keydown", keydown);
      reset();
    };
  }, [canvas, invalidate, reset, start]);

  useEffect(() => () => {
    asset.materials.forEach(({ material }) => material.dispose());
  }, [asset]);

  useEffect(() => {
    asset.materials.forEach(({ material, source }) => {
      material.copy(source);
      material.envMapIntensity = .35;
      if (style === "blueprint") {
        material.wireframe = true;
        material.color.set("#376b78");
      } else if (style === "alloy") {
        material.color.set("#b9b9a7");
        material.metalness = .86;
        material.roughness = .29;
      } else if (style === "clay") {
        material.color.set(/wool|felt/i.test(material.name) ? "#cba181" : "#a76848");
        material.metalness = 0;
        material.roughness = .88;
      }
      material.needsUpdate = true;
    });
    invalidate();
  }, [asset, style, invalidate]);

  useFrame((_, delta) => {
    if (hidden.current) return;
    const idle = motion && animateInteractions;
    const dt = Math.max(0, Math.min(delta, .05));
    const target = idle ? 1 : 0;
    idleWeight.current += (target - idleWeight.current) * (1 - Math.exp(-dt * 8));
    if (Math.abs(target - idleWeight.current) < .001) idleWeight.current = target;
    if (idle || idleWeight.current > 0) elapsed.current += dt;
    for (const sheep of asset.sheep) {
      const pose = sampleSheepPose(sheep.index, clocks.current[sheep.index], elapsed.current, idleWeight.current, animateInteractions);
      sheep.root.position.copy(sheep.position);
      sheep.root.position.y += pose.hop * sheep.root.scale.y;
      sheep.joints.forEach(restoreJoint);
      sheep.head.object.rotation.x += pose.pitch;
      sheep.head.object.rotation.y += pose.yaw;
      if (sheep.jaw) {
        const began = singing.current[sheep.index];
        const mouth = began !== null && animateInteractions
          ? .011 * Math.sin(Math.min(1, (performance.now() - began) / 70) * Math.PI / 2) : 0;
        // Keep the singing mouth inside the same clearance envelope as grazing.
        sheep.jaw.object.rotation.x += Math.max(pose.jawPitch, mouth);
        sheep.jaw.object.rotation.y += pose.jawYaw;
      }
      sheep.body.object.position.y += pose.bodyLift;
      sheep.body.object.rotation.x += pose.bodyPitch;
      sheep.body.object.rotation.z += pose.bodyRoll;
      sheep.body.object.scale.y *= 1 + pose.bodyStretch;
      sheep.body.object.scale.x *= 1 - pose.bodyStretch * .45;
      sheep.ears.forEach((ear, index) => {
        if (ear) ear.object.rotation.z += index === 0 ? pose.earLeft : pose.earRight;
      });
      if (sheep.tail) sheep.tail.object.rotation.y += pose.tail;
      sheep.legs.forEach((leg, index) => {
        if (leg) leg.object.rotation.x += index < 2 ? pose.frontLeg : pose.backLeg;
      });
    }
    for (const { material, source, sheep: index } of asset.materials) {
      material.emissive.copy(source.emissive);
      if (index === null) continue;
      const sheep = asset.sheep.find((item) => item.index === index);
      if (!sheep) continue;
      const active = clocks.current[index] >= 0 || singing.current[index] !== null;
      const amount = active && !animateInteractions ? .18 : hovered.current === index ? .028 : 0;
      if (amount) material.emissive.lerp(sheep.tint, amount);
    }
    const hadActive = clocks.current.some((clock) => clock >= 0);
    if (animateInteractions) advanceSheepClocks(clocks.current, delta);
    // Idle breathes only with ambient motion; a last click frame restores the exact rest pose.
    if (idle || idleWeight.current > 0 || ((hadActive || singing.current.some((start) => start !== null)) && animateInteractions)) invalidate();
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    // The closest landscape mesh occludes sheep behind it.
    event.stopPropagation();
    if (event.delta > 6 || event.button !== 0 || !isModelTap(canvas)) return;
    const index = sheepIndex(event.object);
    if (index !== null) start(index);
  };

  return (
    <group scale={asset.scale}>
      <group position={[-asset.center.x, -asset.center.y, -asset.center.z]}>
        <primitive object={asset.model} dispose={null} onClick={onClick}
          onPointerMove={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            const index = sheepIndex(event.object);
            canvas.style.cursor = index === null ? "" : "pointer";
            if (hovered.current !== index) { hovered.current = index; invalidate(); }
          }}
          onPointerOut={() => {
            hovered.current = null;
            canvas.style.cursor = "";
            invalidate();
          }}
        />
        <SteppeWater model={asset.model} motion={motion && animateInteractions} style={style} />
      </group>
    </group>
  );
}
