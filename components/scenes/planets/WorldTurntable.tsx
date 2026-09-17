"use client";

/* eslint-disable react/no-unknown-property */
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  advance,
  createTurntable,
  drag,
  hold,
  release,
} from "./turntable-motion";
import {
  beginModelGesture,
  moveModelGesture,
  endModelGesture,
  clearModelGesture,
} from "./model-tap";

export default function WorldTurntable({
  children,
  motion,
  index,
  resetKey,
  orbitStep,
  onHoldChange,
  zoomed,
}: {
  children: ReactNode;
  motion: boolean;
  index: number;
  resetKey: number;
  orbitStep: number;
  onHoldChange: (held: boolean) => void;
  zoomed: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const state = useRef(createTurntable());
  const time = useRef(0);
  const previousStep = useRef(orbitStep);
  const { gl, invalidate, camera, size, setDpr } = useThree();

  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const distance = Math.max(
      11,
      6.9 / (2 * Math.tan(THREE.MathUtils.degToRad(19)) * aspect),
    );
    camera.position
      .set(5.8, 4.15, 8.7)
      .normalize()
      .multiplyScalar(distance * (zoomed ? 0.9 : 1));
    camera.lookAt(0, 0.15, 0);
    setDpr(
      Math.min(window.devicePixelRatio || 1, size.width < 768 ? 1.25 : 1.5),
    );
    invalidate();
  }, [camera, size.width, size.height, zoomed, setDpr, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const finish = (id: number, cancelled = false) => {
      if (!release(state.current, id, performance.now(), cancelled)) return;
      endModelGesture(canvas, id, cancelled);
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      onHoldChange(false);
      invalidate();
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      if (
        !hold(
          state.current,
          event.pointerId,
          event.clientX,
          event.clientY,
          performance.now(),
        )
      )
        return;
      beginModelGesture(canvas, event.pointerId, event.clientX, event.clientY);
      canvas.setPointerCapture(event.pointerId);
      onHoldChange(true);
      invalidate();
    };
    const move = (event: PointerEvent) => {
      moveModelGesture(canvas, event.pointerId, event.clientX, event.clientY);
      if (
        drag(
          state.current,
          event.pointerId,
          event.clientX,
          event.clientY,
          performance.now(),
          canvas.clientWidth,
        )
      )
        invalidate();
    };
    const up = (event: PointerEvent) => {
      moveModelGesture(canvas, event.pointerId, event.clientX, event.clientY);
      finish(event.pointerId);
    };
    const cancel = (event: PointerEvent) => finish(event.pointerId, true);
    const abandon = () => {
      if (state.current.pointer !== null) finish(state.current.pointer, true);
    };
    const visibility = () => {
      if (document.hidden) abandon();
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
          event.key,
        )
      )
        return;
      event.preventDefault();
      if (event.key === "Home") {
        abandon();
        state.current = createTurntable();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        state.current.yaw +=
          ((event.key === "ArrowLeft" ? -1 : 1) * Math.PI) / 8;
      } else {
        state.current.pitch = THREE.MathUtils.clamp(
          state.current.pitch + (event.key === "ArrowUp" ? -0.08 : 0.08),
          -0.25,
          0.3,
        );
      }
      invalidate();
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("lostpointercapture", cancel);
    canvas.addEventListener("keydown", keydown);
    window.addEventListener("blur", abandon);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
      canvas.removeEventListener("keydown", keydown);
      window.removeEventListener("blur", abandon);
      document.removeEventListener("visibilitychange", visibility);
      abandon();
      clearModelGesture(canvas);
    };
  }, [gl, invalidate, onHoldChange]);

  useEffect(() => {
    const id = state.current.pointer;
    state.current = createTurntable();
    time.current = 0;
    clearModelGesture(gl.domElement);
    if (id !== null && gl.domElement.hasPointerCapture(id))
      gl.domElement.releasePointerCapture(id);
    onHoldChange(false);
    invalidate();
  }, [index, resetKey, gl, onHoldChange, invalidate]);

  useEffect(() => {
    state.current.yaw += ((orbitStep - previousStep.current) * Math.PI) / 8;
    previousStep.current = orbitStep;
    invalidate();
  }, [orbitStep, invalidate]);

  useFrame((_, delta) => {
    if (!group.current) return;
    advance(state.current, delta, motion);
    if (motion && state.current.pointer === null)
      time.current += Math.min(delta, 0.05);
    group.current.rotation.set(
      state.current.pitch,
      state.current.yaw,
      0,
      "YXZ",
    );
    group.current.position.y = Math.sin(time.current * 0.65) * 0.035;
  });

  return (
    <group ref={group} name="project-world">
      <Suspense
        fallback={
          <Html center className="pointer-events-none">
            <span className="studio-loader" aria-hidden="true" />
          </Html>
        }
      >
        {children}
      </Suspense>
    </group>
  );
}
