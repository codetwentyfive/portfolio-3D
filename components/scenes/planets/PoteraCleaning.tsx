"use client";

/* eslint-disable react/no-unknown-property */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { isModelTap } from "./model-tap";
import { POTERA_CLEANING_DURATION, POTERA_PANE, samplePoteraCleaning } from "./potera-motion";
import type { SceneActionProps } from "./useSceneAction";

function isCleaningTarget(object: THREE.Object3D | null) {
  for (let current = object; current; current = current.parent) {
    if (/^potera_(cleanable_window|equipment|service_sign)$/.test(current.name)) return true;
    if (current instanceof THREE.Mesh) {
      const materials = Array.isArray(current.material) ? current.material : [current.material];
      if (materials.some((material) => material.name === "Potera bay glass" || material.name.endsWith("official logo"))) return true;
    }
  }
  return false;
}

export default function PoteraCleaning({ model, actionKey, animateInteractions }: {
  model: THREE.Object3D;
} & SceneActionProps) {
  const canvas = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const elapsed = useRef<number | null>(null);
  const previousAction = useRef(actionKey);
  const runtime = useMemo(() => {
    const root = new THREE.Group();
    root.name = "Potera cleaning overlay";
    const uniforms = {
      cleaned: { value: 0 },
      working: { value: 0 },
      sheen: { value: 0 },
      sheenProgress: { value: 0 },
      dirtColor: { value: new THREE.Color("#a5aa98") },
      sheenColor: { value: new THREE.Color("#d3e7df") },
    };
    const hazeMaterial = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      vertexShader: `varying vec2 vPaneUv;
        void main() { vPaneUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vPaneUv;
        uniform float cleaned, working, sheen, sheenProgress;
        uniform vec3 dirtColor, sheenColor;
        void main() {
          vec2 uv = vPaneUv;
          float edge = smoothstep(0.0, .018, uv.x) * smoothstep(0.0, .018, 1.0-uv.x)
            * smoothstep(0.0, .02, uv.y) * smoothstep(0.0, .02, 1.0-uv.y);
          float streak = .56 + .15 * sin(uv.x * 67.0 + sin(uv.y * 8.0))
            + .10 * sin(uv.x * 91.0 - uv.y * 15.0);
          float weather = .11 + streak * .18 + pow(abs(uv.x - .5) * 2.0, 5.0) * .10;
          float wipe = 1.0 - cleaned;
          float remaining = (1.0 - smoothstep(wipe - .009, wipe + .009, uv.y)) * (1.0 - step(.9999, cleaned));
          float foam = (1.0 - smoothstep(.003, .023, abs(uv.y - wipe))) * working * .10;
          float diagonal = uv.x * .64 + uv.y * .36;
          float reflection = (1.0 - smoothstep(.025, .13, abs(diagonal - (sheenProgress * 1.28 - .14)))) * sheen;
          float haze = remaining * weather;
          float alpha = (haze + foam + reflection) * edge;
          vec3 color = mix(dirtColor, sheenColor, clamp((foam + reflection) / max(alpha, .001), 0.0, 1.0));
          gl_FragColor = vec4(color, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(POTERA_PANE.width, POTERA_PANE.height), hazeMaterial);
    haze.position.z = .018;
    haze.renderOrder = 2;
    haze.raycast = () => {};
    root.add(haze);

    const tool = new THREE.Group();
    tool.name = "Potera squeegee";
    tool.visible = false;
    root.add(tool);
    const materials = {
      metal: new THREE.MeshStandardMaterial({ color: "#b4c3c0", metalness: .72, roughness: .26, transparent: true }),
      rubber: new THREE.MeshStandardMaterial({ color: "#273c3b", roughness: .82, transparent: true }),
      grip: new THREE.MeshStandardMaterial({ color: "#365955", roughness: .60, transparent: true }),
    };
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], rotationX = 0) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.rotation.x = rotationX;
      mesh.raycast = () => {};
      mesh.castShadow = false;
      tool.add(mesh);
      return mesh;
    };
    // The rubber edge touches the pane; its metal channel, socket and shaped grip project outward.
    add(new THREE.BoxGeometry(POTERA_PANE.bladeWidth, .018, .012), materials.rubber, [0, -.013, .027]);
    add(new THREE.BoxGeometry(1.29, .040, .033), materials.metal, [0, .008, .052]);
    for (const x of [-.635, .635]) add(new THREE.BoxGeometry(.027, .042, .038), materials.rubber, [x, .007, .055]);
    add(new THREE.BoxGeometry(.050, .038, .098), materials.metal, [0, .006, .092]);
    add(new THREE.BoxGeometry(.087, .071, .053), materials.metal, [0, -.028, .140]);
    // The forward-angled neck clears the projecting limestone sill at the bottom of the pass.
    add(new THREE.CylinderGeometry(.018, .023, Math.hypot(.117, .16), 10), materials.metal, [0, -.0865, .25], -Math.atan2(.16, .117));
    const gripTilt = -Math.atan2(.10, .195);
    add(new THREE.CylinderGeometry(.030, .037, Math.hypot(.195, .10), 12), materials.grip, [0, -.2425, .38], gripTilt);
    add(new THREE.SphereGeometry(.037, 12, 8), materials.grip, [0, -.340, .43]);
    for (const y of [-.18, -.22, -.26, -.30]) {
      add(new THREE.TorusGeometry(.032, .0024, 5, 12), materials.rubber, [0, y, .33 + (-y - .145) * (.10 / .195)], Math.PI / 2 + gripTilt);
    }
    return { root, tool, haze, uniforms, materials };
  }, []);

  const finish = useCallback(() => {
    elapsed.current = null;
    runtime.tool.visible = false;
    runtime.haze.visible = false;
    runtime.uniforms.cleaned.value = 1;
    runtime.uniforms.working.value = 0;
    runtime.uniforms.sheen.value = 0;
    invalidate();
  }, [runtime, invalidate]);

  const start = useCallback(() => {
    if (document.hidden || elapsed.current !== null) return;
    if (!animateInteractions) { finish(); return; }
    elapsed.current = 0;
    runtime.haze.visible = true;
    runtime.uniforms.cleaned.value = 0;
    runtime.uniforms.working.value = 0;
    runtime.uniforms.sheen.value = 0;
    invalidate();
  }, [animateInteractions, finish, runtime, invalidate]);

  useEffect(() => {
    const anchor = model.getObjectByName("potera_cleanable_window");
    if (!anchor) return;
    const glass: { mesh: THREE.Mesh; original: THREE.Material | THREE.Material[]; owned: THREE.Material[] }[] = [];
    anchor.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const original = object.material;
      const source = Array.isArray(original) ? original : [original];
      if (!source.some((material) => material.name === "Potera bay glass")) return;
      const owned = source.map((material) => {
        const clone = material.clone();
        if (clone instanceof THREE.MeshStandardMaterial) {
          clone.roughness = .22;
          clone.envMapIntensity = .55;
        }
        return clone;
      });
      object.material = Array.isArray(original) ? owned : owned[0];
      glass.push({ mesh: object, original, owned });
    });
    anchor.add(runtime.root);
    invalidate();
    return () => {
      runtime.root.removeFromParent();
      for (const { mesh, original, owned } of glass) {
        mesh.material = original;
        owned.forEach((material) => material.dispose());
      }
    };
  }, [model, runtime, invalidate]);

  useEffect(() => {
    if (previousAction.current !== actionKey) start();
    previousAction.current = actionKey;
  }, [actionKey, start]);

  useEffect(() => {
    if (!animateInteractions && elapsed.current !== null) finish();
  }, [animateInteractions, finish]);

  useEffect(() => {
    const visibility = () => {
      if (document.hidden) {
        if (elapsed.current !== null) finish();
        canvas.style.cursor = "";
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      elapsed.current = null;
      canvas.style.cursor = "";
    };
  }, [canvas, finish]);

  useEffect(() => () => {
    runtime.root.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    runtime.haze.material.dispose();
    Object.values(runtime.materials).forEach((material) => material.dispose());
  }, [runtime]);

  useFrame((_, delta) => {
    if (elapsed.current === null || document.hidden || !animateInteractions) return;
    elapsed.current = Math.min(POTERA_CLEANING_DURATION, elapsed.current + Math.max(0, Math.min(delta, .05)));
    const pose = samplePoteraCleaning(elapsed.current);
    if (!pose.active) { finish(); return; }
    runtime.uniforms.cleaned.value = pose.cleaned;
    runtime.uniforms.working.value = pose.cleaned > 0 && pose.cleaned < 1 ? pose.toolOpacity : 0;
    runtime.uniforms.sheen.value = pose.sheen;
    runtime.uniforms.sheenProgress.value = pose.sheenProgress;
    runtime.tool.visible = pose.toolOpacity > .001;
    runtime.tool.position.set(0, pose.bladeY, pose.toolZ);
    Object.values(runtime.materials).forEach((material) => { material.opacity = pose.toolOpacity; });
    invalidate();
  });

  const hover = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    canvas.style.cursor = isCleaningTarget(event.object) ? "pointer" : "";
  };
  return <primitive object={model} dispose={null}
    onClick={(event: ThreeEvent<MouseEvent>) => {
      // The nearest landscape/building surface always occludes targets behind it.
      event.stopPropagation();
      if (event.button !== 0 || event.delta > 6 || !isModelTap(canvas) || !isCleaningTarget(event.object)) return;
      start();
    }}
    onPointerOver={hover}
    onPointerMove={hover}
    onPointerOut={() => { canvas.style.cursor = ""; }}
  />;
}
