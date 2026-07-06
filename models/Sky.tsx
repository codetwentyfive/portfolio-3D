"use client";

import { useGLTF } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const skyScene = "/3d/sky.glb";
const skySceneHQ = "/3d/sky-hq.glb";

type SkyProps = {
  isRotating: boolean;
};

type LoadedGLTF = { scene: THREE.Group };

// drei's useGLTF exposes a callback-style loader at runtime that isn't in its types
const loadGLTF = (useGLTF as unknown as {
  load: (
    url: string,
    onLoad: (gltf: LoadedGLTF) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void
  ) => void;
}).load;

const Sky = ({ isRotating }: SkyProps) => {
  const skyRef = useRef<THREE.Mesh>(null);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  // Load low-res version immediately
  const { scene: lowResScene } = useGLTF(skyScene);

  // Load high-res version in the background
  useEffect(() => {
    let mounted = true;

    const loadHighQuality = async () => {
      try {
        const { scene: highResScene } = await new Promise<LoadedGLTF>((resolve, reject) => {
          loadGLTF(skySceneHQ,
            (gltf) => resolve(gltf),
            undefined,
            (error) => reject(error)
          );
        });

        if (mounted && skyRef.current && highResScene.children[0]) {
          // Replace the scene's material and textures
          (skyRef.current.children[0] as THREE.Mesh).material =
            (highResScene.children[0] as THREE.Mesh).material;
          setIsHighQualityLoaded(true);
        }
      } catch (error) {
        console.log("Failed to load high-quality sky:", error);
      }
    };

    // Start loading high-quality version after a short delay
    const timer = setTimeout(loadHighQuality, 2000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  useFrame((_, delta) => {
    if (isRotating && skyRef.current) {
      skyRef.current.rotation.y += 0.1 * delta;
    }
  });

  return (
    <mesh ref={skyRef}>
      <primitive object={lowResScene} />
    </mesh>
  );
};

export default Sky;

// Preload low-res version
useGLTF.preload(skyScene);
