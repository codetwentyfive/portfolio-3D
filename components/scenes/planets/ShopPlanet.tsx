"use client";

/* eslint-disable react/no-unknown-property */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PaintedMaterial } from "./PaintedMaterial";
import { CraftsmanAsset, GerAsset, SheepAsset } from "./ShopAssets";
import type { GerStyle } from "./planet-data";

type Triple = [number, number, number];
const random = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const edge = (a: number) =>
  1 + Math.sin(a * 3) * 0.022 + Math.cos(a * 7) * 0.012;
const groundHeight = (x: number, z: number) =>
  0.11 + Math.sin(x * 2 + z) * Math.sin(z * 1.5) * 0.014;

function Beam({
  from,
  to,
  radius = 0.025,
  color = "#705035",
}: {
  from: Triple;
  to: Triple;
  radius?: number;
  color?: string;
}) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh
      position={start.add(end).multiplyScalar(0.5)}
      quaternion={quaternion}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[radius * 0.9, radius, direction.length(), 12]} />
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}

function Pebble({
  position,
  scale,
  color,
}: {
  position: Triple;
  scale: Triple;
  color: string;
}) {
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={[0.2, position[0] * 2, 0.3]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[1, 16, 10]} />
      <PaintedMaterial color={color} />
    </mesh>
  );
}

function islandGeometry() {
  const segments = 96;
  const rings = 20;
  const topVertices: number[] = [];
  const topIndices: number[] = [];
  for (let j = 0; j <= rings; j++) {
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const radius = (j / rings) * 3.08 * edge(a);
      const x = Math.sin(a) * radius;
      const z = Math.cos(a) * radius * 0.83;
      topVertices.push(x, groundHeight(x, z), z);
      if (j < rings && i < segments) {
        const k = j * (segments + 1) + i;
        topIndices.push(
          k,
          k + segments + 2,
          k + 1,
          k,
          k + segments + 1,
          k + segments + 2,
        );
      }
    }
  }
  const surface = new THREE.BufferGeometry();
  surface.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(topVertices, 3),
  );
  surface.setIndex(topIndices);
  surface.computeVertexNormals();

  const profile = [
    [3.08, 0.105],
    [3.09, -0.035],
    [3.055, -0.17],
    [2.97, -0.33],
    [2.76, -0.63],
    [2.4, -0.95],
    [1.8, -1.26],
    [1.1, -1.53],
    [0.4, -1.66],
    [0, -1.67],
  ];
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const rock = new THREE.Color();
  profile.forEach(([radius, height], j) => {
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const relief =
        j < 3
          ? 0
          : Math.sin(a * 9 + j * 0.8) * 0.04 + Math.cos(a * 5 - j) * 0.055;
      const r = radius * edge(a) + relief;
      vertices.push(
        Math.sin(a) * r,
        height + (j < 2 ? 0 : Math.sin(a * 7 + j) * 0.025),
        Math.cos(a) * r * 0.83,
      );
      rock.set(
        j === 0
          ? "#586e34"
          : j === 1
            ? "#4f4d2c"
            : j < 4
              ? "#6c5037"
              : "#636c62",
      );
      rock.multiplyScalar(0.92 + Math.sin(a * 5 + j) * 0.08);
      colors.push(rock.r, rock.g, rock.b);
      if (j < profile.length - 1 && i < segments) {
        const k = j * (segments + 1) + i;
        indices.push(
          k,
          k + segments + 2,
          k + 1,
          k,
          k + segments + 1,
          k + segments + 2,
        );
      }
    }
  });
  const underside = new THREE.BufferGeometry();
  underside.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  underside.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  underside.setIndex(indices);
  underside.computeVertexNormals();
  return { surface, underside };
}

export function Terrain({
  ground = "#678942",
  pasture = true,
  motion = true,
}: {
  ground?: string;
  pasture?: boolean;
  motion?: boolean;
}) {
  const [geometry] = useState(islandGeometry);
  const grass = useRef<THREE.InstancedMesh>(null);
  const grassShader = useRef<
    Parameters<THREE.MeshStandardMaterial["onBeforeCompile"]>[0] | null
  >(null);
  const elapsed = useRef(0);
  const [blade] = useState(() => {
    const mesh = new THREE.PlaneGeometry(1, 1, 1, 4).translate(0, 0.5, 0);
    const position = mesh.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      position.setX(i, position.getX(i) * (1 - y) + y * y * 0.25);
    }
    mesh.computeVertexNormals();
    return mesh;
  });
  useEffect(
    () => () => {
      blade.dispose();
      geometry.surface.dispose();
      geometry.underside.dispose();
    },
    [blade, geometry],
  );
  useLayoutEffect(() => {
    if (!grass.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let count = 0;
    for (let i = 0; i < 4600; i++) {
      const theta = random(i + 1) * Math.PI * 2;
      const radius = Math.sqrt(random(i + 900)) * 3.03 * edge(theta);
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius * 0.83;
      const inGer = Math.hypot(x + 0.65, z + 0.4) < 1.29;
      const inPath = Math.abs(x + 0.65) < 0.31 && z > 0.45;
      const inWorkshop = Math.abs(x - 1.13) < 0.44 && z > 0.08 && z < 1.1;
      if (inGer || inPath || inWorkshop) continue;
      dummy.position.set(x, groundHeight(x, z), z);
      dummy.rotation.set(
        0,
        random(i + 50) * 6.28,
        (random(i + 23) - 0.5) * 0.3,
      );
      const height = 0.05 + random(i + 80) * 0.105;
      dummy.scale.set(0.018 + random(i + 300) * 0.018, height, 1);
      dummy.updateMatrix();
      grass.current.setMatrixAt(count, dummy.matrix);
      color.setHSL(
        0.195 + random(i + 99) * 0.045,
        0.43,
        0.24 + random(i + 130) * 0.11,
      );
      grass.current.setColorAt(count++, color);
    }
    // Omit hidden blades rather than uploading singular zero-scale instances.
    grass.current.count = count;
    grass.current.instanceMatrix.needsUpdate = true;
    if (grass.current.instanceColor)
      grass.current.instanceColor.needsUpdate = true;
  }, []);
  useFrame((_, delta) => {
    if (motion) elapsed.current += Math.min(delta, 0.05);
    if (grassShader.current)
      grassShader.current.uniforms.uWind.value = elapsed.current;
  });
  return (
    <group>
      <mesh geometry={geometry.surface} receiveShadow castShadow>
        <PaintedMaterial color={ground} />
      </mesh>
      <mesh geometry={geometry.underside} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.93}
          envMapIntensity={0.25}
        />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const theta = i * 2.4;
        return (
          <Pebble
            key={i}
            position={[Math.sin(theta) * 2.45, -0.51, Math.cos(theta) * 2.03]}
            scale={[0.29 + random(i) * 0.2, 0.34, 0.23 + random(i + 4) * 0.19]}
            color={i % 2 ? "#777b6d" : "#5e6a61"}
          />
        );
      })}
      {pasture && (
        <>
          <instancedMesh
            ref={grass}
            args={[undefined, undefined, 4600]}
            frustumCulled={false}
            receiveShadow
          >
            <primitive object={blade} attach="geometry" />
            <meshStandardMaterial
              side={THREE.DoubleSide}
              roughness={1}
              envMapIntensity={0.25}
              onBeforeCompile={(shader) => {
                grassShader.current = shader;
                shader.uniforms.uWind = { value: 0 };
                shader.vertexShader = `uniform float uWind;\n${shader.vertexShader}`;
                shader.vertexShader = shader.vertexShader.replace(
                  "#include <begin_vertex>",
                  `#include <begin_vertex>\ntransformed.x += sin(uWind * 1.3 + instanceMatrix[3].x * 2.0 + instanceMatrix[3].z) * 0.45 * position.y * position.y;`,
                );
              }}
              customProgramCacheKey={() => "steppe-wind-v2"}
            />
          </instancedMesh>
          {Array.from({ length: 9 }, (_, i) => (
            <Pebble
              key={i}
              position={[-0.64 + Math.sin(i * 2) * 0.1, 0.12, 0.83 + i * 0.17]}
              scale={[0.23, 0.025, 0.12]}
              color={i % 2 ? "#b9b396" : "#a29f86"}
            />
          ))}
          {Array.from({ length: 18 }, (_, i) => {
            const theta = i * 2.4;
            const radius = 2.1 + random(i + 17) * 0.8;
            return (
              <group
                key={i}
                position={[
                  Math.cos(theta) * radius,
                  0.12,
                  Math.sin(theta) * radius * 0.8,
                ]}
              >
                <Beam
                  from={[0, 0, 0]}
                  to={[0, 0.19, 0]}
                  radius={0.006}
                  color="#57793e"
                />
                <mesh position={[0, 0.2, 0]} scale={[1, 0.4, 1]}>
                  <sphereGeometry args={[0.038, 12, 8]} />
                  <meshStandardMaterial
                    color={i % 3 ? "#e4c276" : "#cc9bb3"}
                    roughness={0.85}
                  />
                </mesh>
                <mesh position={[0, 0.214, 0]}>
                  <sphereGeometry args={[0.012, 8, 6]} />
                  <meshStandardMaterial color="#8e562b" />
                </mesh>
              </group>
            );
          })}
        </>
      )}
    </group>
  );
}

function LeatherRack() {
  const hide = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.25, 0.27);
    shape.bezierCurveTo(-0.13, 0.22, -0.12, 0.32, 0, 0.28);
    shape.bezierCurveTo(0.12, 0.32, 0.16, 0.23, 0.25, 0.27);
    shape.bezierCurveTo(0.17, 0.05, 0.23, -0.06, 0.29, -0.19);
    shape.bezierCurveTo(0.12, -0.17, 0.16, -0.31, 0, -0.28);
    shape.bezierCurveTo(-0.16, -0.31, -0.12, -0.17, -0.29, -0.19);
    shape.bezierCurveTo(-0.23, -0.06, -0.17, 0.05, -0.25, 0.27);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.01,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.005,
      curveSegments: 8,
    });
  }, []);
  useEffect(() => () => hide.dispose(), [hide]);
  return (
    <group position={[1.63, 0.12, -1.43]} rotation={[0, -0.15, 0]}>
      <Beam from={[-0.34, 0, 0.08]} to={[-0.34, 0.99, 0]} radius={0.027} />
      <Beam from={[0.34, 0, 0.08]} to={[0.34, 0.99, 0]} radius={0.027} />
      <Beam from={[-0.4, 0.92, 0]} to={[0.4, 0.92, 0]} radius={0.022} />
      <Beam
        from={[-0.34, 0.9, 0]}
        to={[-0.22, 0.77, 0]}
        radius={0.005}
        color="#b7a177"
      />
      <Beam
        from={[0.34, 0.9, 0]}
        to={[0.22, 0.77, 0]}
        radius={0.005}
        color="#b7a177"
      />
      <mesh position={[0, 0.5, 0]} geometry={hide} castShadow receiveShadow>
        <PaintedMaterial color="#a9693d" />
      </mesh>
    </group>
  );
}

export default function ShopPlanet({
  style,
  motion,
}: {
  style: GerStyle;
  motion: boolean;
}) {
  return (
    <group>
      <Terrain motion={motion} />
      <GerAsset style={style} motion={motion} />
      <CraftsmanAsset motion={motion} />
      <SheepAsset
        position={[-1.95, 0.12, 0.8]}
        rotation={0.5}
        motion={motion}
        index={0}
      />
      <SheepAsset
        position={[0.05, 0.12, 1.68]}
        rotation={-0.6}
        motion={motion}
        index={1}
      />
      <SheepAsset
        position={[1.98, 0.12, -0.61]}
        rotation={0.4}
        motion={motion}
        index={2}
      />
      <SheepAsset
        position={[-1.72, 0.12, -1.6]}
        rotation={2.4}
        motion={motion}
        index={3}
      />
      <LeatherRack />
    </group>
  );
}
