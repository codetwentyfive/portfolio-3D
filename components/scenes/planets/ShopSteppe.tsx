"use client";

/* eslint-disable react/no-unknown-property */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import worldVersions from "@/assets/world-versions.json";
import { isModelTap } from "./model-tap";
import type { GerStyle } from "./planet-data";
import type { SceneActionProps } from "./useSceneAction";
import {
  advanceSheepClocks, createSheepClocks, sampleSheepReaction, startSheepReaction,
  type SheepReaction,
} from "./sheep-motion";

function sheepIndex(object: THREE.Object3D | null): number | null {
  while (object) {
    const match = /^sheep_(\d+)$/.exec(object.name);
    if (match) return Number(match[1]);
    object = object.parent;
  }
  return null;
}

const REACTION_COLORS = ["#bd887b", "#d5cdb4", "#ccb979", "#8d9e69", "#a4bbc0", "#cfbb88"];

/** Small handmade accents share the sheep's space and never intercept a pick. */
function createAccent(index: number) {
  const group = new THREE.Group();
  group.name = `sheep_reaction_${index}`;
  group.visible = false;
  const material = new THREE.MeshBasicMaterial({
    color: REACTION_COLORS[index], transparent: true, opacity: 0, depthWrite: false,
  });
  const geometries: THREE.BufferGeometry[] = [];
  const pieces: { mesh: THREE.Mesh; position: THREE.Vector3 }[] = [];
  const mesh = (geometry: THREE.BufferGeometry, x = 0, y = 0, z = 0) => {
    geometries.push(geometry);
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.raycast = () => {};
    group.add(item);
    pieces.push({ mesh: item, position: item.position.clone() });
    return item;
  };
  const stroke = (a: [number, number], b: [number, number], radius = .009) => {
    const start = new THREE.Vector3(...a, 0), end = new THREE.Vector3(...b, 0);
    const item = mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 5));
    item.position.copy(start).add(end).multiplyScalar(.5);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    pieces[pieces.length - 1].position.copy(item.position);
  };
  if (index === 0) {
    const shape = new THREE.Shape();
    shape.moveTo(0, -.075);
    shape.bezierCurveTo(-.035, -.045, -.12, .015, -.075, .075);
    shape.bezierCurveTo(-.04, .115, -.005, .084, 0, .058);
    shape.bezierCurveTo(.005, .084, .04, .115, .075, .075);
    shape.bezierCurveTo(.12, .015, .035, -.045, 0, -.075);
    mesh(new THREE.ExtrudeGeometry(shape, { depth: .017, bevelEnabled: false, curveSegments: 4 }));
  } else if (index === 1) {
    for (let i = 0; i < 5; i++) mesh(new THREE.IcosahedronGeometry(.026 - i * .002, 0), (i - 2) * .085, Math.sin(i * 2) * .055);
  } else if (index === 3) {
    for (let i = 0; i < 4; i++) {
      const leaf = mesh(new THREE.OctahedronGeometry(.028, 0), (i - 1.5) * .045, i % 2 * .025);
      leaf.scale.set(.4, 1, .25);
      leaf.rotation.z = (i - 1.5) * .45;
    }
  } else if (index === 4) {
    // The sleepy mark is physical line geometry, with no font or emoji asset.
    stroke([-.07, .06], [.065, .06]);
    stroke([.065, .06], [-.07, -.055]);
    stroke([-.07, -.055], [.065, -.055]);
  } else if (index === 5) {
    stroke([-.072, -.015], [-.10, .10]);
    stroke([.042, -.015], [.083, .087]);
  }
  group.position.set(0, index === 3 ? .21 : index === 4 ? .76 : .91, index === 3 ? .77 : .36);
  return { group, material, geometries, pieces, position: group.position.clone() };
}

function updateAccent(accent: ReturnType<typeof createAccent>, index: number, reaction: SheepReaction) {
  const { progress: p } = reaction;
  accent.group.visible = reaction.accent > .005;
  accent.material.opacity = reaction.accent * .88;
  accent.group.position.copy(accent.position);
  accent.group.scale.setScalar(1);
  if (!accent.group.visible) return;
  if (index === 0 || index === 4) {
    accent.group.position.y += p * .19;
    accent.group.scale.setScalar(.8 + .2 * Math.sin(p * Math.PI));
  }
  for (let i = 0; i < accent.pieces.length; i++) {
    const part = accent.pieces[i];
    part.mesh.position.copy(part.position);
    if (index === 1) {
      part.mesh.position.x += (i - 2) * .095 * p;
      part.mesh.position.y += Math.sin(p * Math.PI) * .12 + p * .035;
      part.mesh.rotation.z = p * (i % 2 ? 1 : -1);
    } else if (index === 3) {
      const lift = (p * 3 + i * .21) % 1;
      part.mesh.position.x += (i - 1.5) * lift * .025;
      part.mesh.position.y += Math.sin(lift * Math.PI) * .075;
      part.mesh.rotation.z = (i - 1.5) * .45 + lift;
    }
  }
}

export default function ShopSteppe({
  style, motion, actionKey, animateInteractions,
}: SceneActionProps & { style: GerStyle; motion: boolean }) {
  const { scene } = useGLTF(`/3d/shop/steppe-v${worldVersions.shop}.glb`);
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const clocks = useRef(createSheepClocks());
  const elapsed = useRef(0);
  const hovered = useRef<number | null>(null);
  const hidden = useRef(false);
  const previousAction = useRef(actionKey);
  const nextSheep = useRef(0);
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
      object.castShadow = !fineDetail;
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
    // Measure authored geometry before adding any temporary accents.
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const sheep = Array.from({ length: 6 }, (_, index) => {
      const root = model.getObjectByName(`sheep_${index}`);
      const head = model.getObjectByName(`sheep_head_${index}`);
      const wool = model.getObjectByName(`sheep_${index}_Sheep_wool`);
      if (!root || !head || !wool) return null;
      const accent = createAccent(index);
      root.add(accent.group);
      return {
        index, root, head, wool, accent,
        position: root.position.clone(), rotation: head.rotation.clone(),
        woolPosition: wool.position.clone(), woolScale: wool.scale.clone(),
        tint: new THREE.Color(REACTION_COLORS[index]),
      };
    }).filter((sheep): sheep is NonNullable<typeof sheep> => sheep !== null);
    return {
      model, materials, sheep, quaternion: new THREE.Quaternion(),
      center: bounds.getCenter(new THREE.Vector3()),
      // The OG island is also fitted to a longest dimension of six units.
      scale: 6 / Math.max(size.x, size.y, size.z),
    };
  }, [scene]);

  const reset = useCallback(() => {
    clocks.current.fill(-1);
    elapsed.current = 0;
    hovered.current = null;
    for (const sheep of asset.sheep) {
      sheep.root.position.copy(sheep.position);
      sheep.head.rotation.copy(sheep.rotation);
      sheep.wool.position.copy(sheep.woolPosition);
      sheep.wool.scale.copy(sheep.woolScale);
      sheep.accent.group.visible = false;
    }
    for (const { source, material } of asset.materials) material.emissive.copy(source.emissive);
    canvas.style.cursor = "";
    invalidate();
  }, [asset, canvas, invalidate]);

  const start = useCallback((index: number) => {
    if (!document.hidden && startSheepReaction(clocks.current, index)) invalidate();
  }, [invalidate]);

  useEffect(() => {
    if (previousAction.current !== actionKey) {
      start(nextSheep.current);
      nextSheep.current = (nextSheep.current + 1) % 6;
    }
    previousAction.current = actionKey;
  }, [actionKey, start]);

  useEffect(() => {
    const visibility = () => {
      hidden.current = document.hidden;
      if (hidden.current) reset();
      else invalidate();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.target !== canvas || document.activeElement !== canvas || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || !/^[1-6]$/.test(event.key)) return;
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
    asset.sheep.forEach(({ accent }) => {
      accent.material.dispose();
      accent.geometries.forEach((geometry) => geometry.dispose());
    });
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

  useFrame(({ camera }, delta) => {
    if (hidden.current) return;
    const idle = motion && animateInteractions;
    if (idle) elapsed.current += Math.min(delta, .05);
    for (const sheep of asset.sheep) {
      const reaction = sampleSheepReaction(sheep.index, clocks.current[sheep.index], animateInteractions);
      sheep.root.position.copy(sheep.position);
      sheep.root.position.y += reaction.hop;
      sheep.head.rotation.copy(sheep.rotation);
      // An active reaction owns the head; idle movement cannot exceed its envelope.
      if (idle && !reaction.active) {
        sheep.head.rotation.x += Math.sin(elapsed.current * .65 + sheep.index * 1.9) * .035;
        sheep.head.rotation.y += Math.sin(elapsed.current * .34 + sheep.index * 2.3) * .035;
      }
      sheep.head.rotation.x += reaction.pitch;
      sheep.head.rotation.y += reaction.yaw;
      sheep.wool.position.copy(sheep.woolPosition);
      sheep.wool.scale.copy(sheep.woolScale);
      sheep.wool.scale.x *= 1 + reaction.wool * .035;
      sheep.wool.scale.y *= 1 - reaction.wool * .018;
      sheep.wool.scale.z *= 1 + reaction.wool * .025;
      updateAccent(sheep.accent, sheep.index, reaction);
      if (sheep.accent.group.visible) {
        sheep.root.getWorldQuaternion(asset.quaternion);
        sheep.accent.group.quaternion.copy(asset.quaternion.invert()).multiply(camera.quaternion);
      }
    }
    for (const { material, source, sheep: index } of asset.materials) {
      material.emissive.copy(source.emissive);
      if (index === null) continue;
      const sheep = asset.sheep.find((item) => item.index === index);
      if (!sheep) continue;
      const active = clocks.current[index] >= 0;
      const amount = active ? (animateInteractions ? .035 : .18) : hovered.current === index ? .035 : 0;
      if (amount) material.emissive.lerp(sheep.tint, amount);
    }
    const hadActive = clocks.current.some((clock) => clock >= 0);
    advanceSheepClocks(clocks.current, delta);
    // The final extra frame restores exact authored transforms after landing.
    if (hadActive) invalidate();
  });

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    // The closest landscape mesh occludes sheep behind it, including their accents.
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
      </group>
    </group>
  );
}
