"use client";

/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import worldVersions from "@/assets/world-versions.json";
import { isModelTap } from "./model-tap";
import type { GerStyle } from "./planet-data";
import { useSceneAction, type SceneActionProps } from "./useSceneAction";

export default function ShopAtelier({ style, actionKey, animateInteractions }: SceneActionProps & { style: GerStyle; motion: boolean }) {
  const { scene } = useGLTF(`/3d/shop/atelier-v${worldVersions.shop}.glb`);
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const target = useRef("bag");
  const action = useSceneAction(actionKey, 2.8);
  const asset = useMemo(() => {
    const model = scene.clone(true);
    const materials = new Map<THREE.MeshStandardMaterial, THREE.MeshStandardMaterial>();
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const clone = (source: THREE.MeshStandardMaterial) => {
        if (!materials.has(source)) materials.set(source, source.clone());
        return materials.get(source)!;
      };
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    });
    const bag = model.getObjectByName("atelier_bag");
    const textile = model.getObjectByName("atelier_textile");
    return { model, materials, bag, textile, bagY: bag?.position.y ?? 0, center: new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()) };
  }, [scene]);
  useEffect(() => () => asset.materials.forEach((material) => material.dispose()), [asset]);
  useEffect(() => { target.current = "bag"; }, [actionKey]);
  useEffect(() => {
    asset.materials.forEach((material, source) => {
      material.copy(source);
      const product = /leather|felt/i.test(material.name);
      if (style === "blueprint" && !/letter|logo/i.test(material.name)) {
        material.wireframe = true;
        material.color.set("#376b78");
      } else if (style === "alloy" && product) {
        material.color.set("#b9b9a7"); material.metalness = .86; material.roughness = .29;
      } else if (style === "clay" && !/letter|logo/i.test(material.name)) {
        material.color.set(product ? "#a76848" : "#c2997b"); material.metalness = 0; material.roughness = .88;
      }
      material.needsUpdate = true;
    });
    invalidate();
  }, [asset, style, invalidate]);
  useFrame(() => {
    const beat = action.active.current ? Math.sin(action.progress.current * Math.PI) : 0;
    asset.materials.forEach((material) => {
      if (!/leather/.test(material.name)) return;
      material.emissive.set(!animateInteractions && action.active.current ? "#735634" : "#000000");
      material.emissiveIntensity = .4;
    });
    if (asset.bag) {
      asset.bag.rotation.y = animateInteractions && target.current === "bag" ? beat * .4 : 0;
      asset.bag.position.y = asset.bagY + (animateInteractions && target.current === "bag" ? beat * .12 : 0);
    }
    if (asset.textile) asset.textile.rotation.z = animateInteractions && target.current === "textile" ? Math.sin(action.progress.current * Math.PI * 4) * beat * .045 : 0;
  });
  return <group position={[-asset.center.x, -asset.center.y, -asset.center.z]}>
    <primitive object={asset.model} dispose={null} {...action.handlers} onClick={(event: import("@react-three/fiber").ThreeEvent<MouseEvent>) => {
      if (event.delta > 6 || event.button !== 0 || !isModelTap(canvas)) return;
      let object: THREE.Object3D | null = event.object;
      target.current = "bag";
      while (object) { if (object.name === "atelier_textile") target.current = "textile"; object = object.parent; }
      action.handlers.onClick(event);
    }} />
  </group>;
}
