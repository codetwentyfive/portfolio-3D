"use client";

/* eslint-disable react/no-unknown-property */
import { useMemo } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import { Shape } from "three";

/** The pool surface, in the same uncentered coordinates as the Denkpause GLB. */
export default function DenkpauseWater() {
  const outline = useMemo(() => {
    const halfWidth = 1.34 / 2;
    const halfDepth = 2.13 / 2;
    const radius = 0.24;
    const shape = new Shape();

    shape.moveTo(-halfWidth + radius, -halfDepth);
    shape.lineTo(halfWidth - radius, -halfDepth);
    shape.absarc(halfWidth - radius, -halfDepth + radius, radius, -Math.PI / 2, 0, false);
    shape.lineTo(halfWidth, halfDepth - radius);
    shape.absarc(halfWidth - radius, halfDepth - radius, radius, 0, Math.PI / 2, false);
    shape.lineTo(-halfWidth + radius, halfDepth);
    shape.absarc(-halfWidth + radius, halfDepth - radius, radius, Math.PI / 2, Math.PI, false);
    shape.lineTo(-halfWidth, -halfDepth + radius);
    shape.absarc(-halfWidth + radius, -halfDepth + radius, radius, Math.PI, Math.PI * 1.5, false);
    shape.closePath();

    return shape;
  }, []);

  return (
    <mesh name="denkpause-reflecting-pool" position={[1.05, 0.27, 0.58]} rotation={[-Math.PI / 2, 0, 0]}>
      <shapeGeometry args={[outline, 24]} />
      {/* Drei updates only on an existing canvas frame, so still water stays idle. */}
      <MeshReflectorMaterial
        resolution={256}
        blur={[64, 24]}
        mixBlur={1.4}
        mixStrength={1.15}
        mirror={0.52}
        mixContrast={0.96}
        color="#719c92"
        roughness={0.2}
        metalness={0.08}
        envMapIntensity={0.75}
        depthScale={0}
      />
    </mesh>
  );
}
