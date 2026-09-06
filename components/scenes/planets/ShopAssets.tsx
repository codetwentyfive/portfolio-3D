"use client";

/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GerStyle } from "./planet-data";

type Shader = Parameters<THREE.MeshStandardMaterial["onBeforeCompile"]>[0];
type Triple = [number, number, number];

function useShopAsset(name: string) {
  const { scene } = useGLTF(`/3d/shop/${name}.glb`);
  // Geometry stays shared; each instance owns its pose and mutable materials.
  const asset = useMemo(() => {
    const root = scene.clone(true);
    const materials = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const cloneMaterial = (source: THREE.MeshStandardMaterial) => {
        if (!materials.has(source)) {
          const material = source.clone();
          material.envMapIntensity = 0.32;
          material.userData.baseColor = material.color.clone();
          material.userData.baseRoughness = material.roughness;
          material.userData.baseMetalness = material.metalness;
          materials.set(source, material);
        }
        return materials.get(source)!;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(cloneMaterial)
        : cloneMaterial(object.material);
    });
    return { root, materials: [...materials.values()] };
  }, [scene]);
  useEffect(
    () => () => asset.materials.forEach((material) => material.dispose()),
    [asset],
  );
  return asset;
}

export function GerAsset({
  style,
  motion,
}: {
  style: GerStyle;
  motion: boolean;
}) {
  const { root, materials } = useShopAsset("ger");
  const shaders = useRef(new Set<Shader>());
  const elapsed = useRef(0);
  useEffect(() => {
    shaders.current.clear();
    for (const material of materials) {
      const felt = material.name.startsWith("Ger_felt");
      const timber = material.name.startsWith("Ger_structure");
      material.color.copy(material.userData.baseColor as THREE.Color);
      material.roughness = material.userData.baseRoughness as number;
      material.metalness = material.userData.baseMetalness as number;
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;
      material.emissive.set("#000000");
      material.envMapIntensity = 0.32;
      if (style === "blueprint" && (felt || timber)) {
        material.color.set(felt ? "#6cb2c8" : "#42bac8");
        if (felt) {
          material.transparent = true;
          material.opacity = 0.07;
          material.depthWrite = false;
        } else {
          material.emissive.set("#18677c");
          material.emissiveIntensity = 0.35;
        }
      } else if (felt && style === "alloy") {
        material.color.set("#bfcbc9");
        material.metalness = 0.94;
        material.roughness = 0.22;
        material.envMapIntensity = 1.4;
      } else if (felt && style === "clay") {
        material.color.set("#b97051");
        material.roughness = 0.78;
      }
      if (felt) {
        material.onBeforeCompile = (shader) => {
          shaders.current.add(shader);
          shader.uniforms.uTime = { value: elapsed.current };
          shader.uniforms.uSmear = { value: 0 };
          shader.vertexShader = `varying vec3 vFelt; uniform float uTime; uniform float uSmear;\n${shader.vertexShader}`;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            `
            #include <begin_vertex>
            vFelt = position;
            float beat = mod(uTime, 5.6);
            float glitch = step(5.20, beat) * (1.0-step(5.49, beat)) * uSmear;
            transformed.x += sin(floor(position.y*28.0)*13.0 + floor(uTime*18.0)) * glitch * 0.15;
          `,
          );
          shader.fragmentShader = `varying vec3 vFelt; uniform float uTime; uniform float uSmear;\n${shader.fragmentShader}`;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            `
            #include <color_fragment>
            float fibre = sin(vFelt.x*380.0 + sin(vFelt.y*240.0))*sin(vFelt.z*340.0);
            float wash = sin(vFelt.x*19.0+vFelt.y*23.0)*sin(vFelt.z*17.0);
            diffuseColor.rgb *= 0.97 + fibre * 0.014 + wash * 0.025;
            float beat = mod(uTime, 5.6);
            float smear = step(5.20, beat) * (1.0-step(5.49, beat)) * uSmear;
            float band = step(0.0, sin(floor(vFelt.y*28.0)*13.0+floor(uTime*18.0)));
            diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.06,0.55,0.66),vec3(0.85,0.19,0.07),band),smear*0.5);
          `,
          );
        };
        material.customProgramCacheKey = () => `ger-fabric-v2-${style}`;
      }
      material.needsUpdate = true;
    }
    root.traverse((object) => {
      if (object instanceof THREE.Mesh)
        object.castShadow = !(
          style === "blueprint" &&
          (object.material as THREE.Material).name.startsWith("Ger_felt")
        );
    });
  }, [materials, root, style]);
  useFrame((_, delta) => {
    if (motion) elapsed.current += Math.min(delta, 0.05);
    for (const shader of shaders.current) {
      shader.uniforms.uTime.value = elapsed.current;
      shader.uniforms.uSmear.value = motion && style === "paint" ? 1 : 0;
    }
  });
  return (
    <primitive
      object={root}
      position={[-0.65, 0.11, -0.4]}
      rotation={[0, -0.08, 0]}
      dispose={null}
    />
  );
}

export function CraftsmanAsset({ motion }: { motion: boolean }) {
  const { root } = useShopAsset("craftsman");
  const bench = useShopAsset("workbench");
  const arm = useMemo(() => root.getObjectByName("stitch_arm"), [root]);
  const head = useMemo(() => root.getObjectByName("craftsman_head"), [root]);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!motion) return;
    elapsed.current += Math.min(delta, 0.05);
    const stitch = Math.sin(elapsed.current * 2.15);
    if (arm) arm.rotation.x = stitch * 0.17;
    if (head) {
      head.rotation.x = 0.08 + Math.sin(elapsed.current * 1.075) * 0.028;
      head.rotation.y = Math.sin(elapsed.current * 0.35) * 0.035;
    }
  });
  return (
    <group position={[1.13, 0.12, 0.14]} rotation={[0, -0.3, 0]} scale={0.93}>
      <primitive object={root} dispose={null} />
      <primitive object={bench.root} dispose={null} />
    </group>
  );
}

export function SheepAsset({
  position,
  rotation,
  index,
  motion,
}: {
  position: Triple;
  rotation: number;
  index: number;
  motion: boolean;
}) {
  const { root } = useShopAsset("sheep");
  const head = useMemo(() => root.getObjectByName("sheep_head"), [root]);
  const elapsed = useRef(index * 1.7);
  useFrame((_, delta) => {
    if (!motion) return;
    elapsed.current += Math.min(delta, 0.05);
    if (head) {
      head.rotation.x = 0.12 + Math.sin(elapsed.current * 0.65) * 0.25;
      head.rotation.y = Math.sin(elapsed.current * 0.37) * 0.1;
    }
  });
  return (
    <primitive
      object={root}
      position={position}
      rotation={[0, rotation, 0]}
      scale={index === 1 ? 0.66 : 0.8}
      dispose={null}
    />
  );
}

for (const name of ["ger", "craftsman", "workbench", "sheep"])
  useGLTF.preload(`/3d/shop/${name}.glb`);
