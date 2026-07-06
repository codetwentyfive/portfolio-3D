"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import Loader from "@/components/Loader";
import { LoadingScreen } from "@/components/LoadingScreen";
import Island from "@/models/Island";
import Sky from "@/models/Sky";
import Bird from "@/models/Bird";
import Plane from "@/models/Plane";
import HomeInfo from "@/components/HomeInfo";

const islandScene = "/3d/island.glb";
const skyScene = "/3d/sky.glb";
const birdScene = "/3d/bird.glb";
const planeScene = "/3d/plane.glb";

// drei v9 types don't surface the callback-style loader; runtime supports it.
const loadGLTF = (
  useGLTF as unknown as {
    load: (
      url: string,
      onLoad: (gltf: unknown) => void,
      onProgress: undefined,
      onError: (error: unknown) => void
    ) => void;
  }
).load;

type Triple = [number, number, number];

const HomeScene = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<number | null>(1);
  const [isRotating, setIsRotating] = useState(false);

  // Preload all models
  useEffect(() => {
    const loadModels = async () => {
      const modelPaths = [islandScene, skyScene, birdScene, planeScene];

      try {
        await Promise.all(
          modelPaths.map(
            (path) =>
              new Promise((resolve, reject) => {
                loadGLTF(path, (gltf) => resolve(gltf), undefined, (error) => reject(error));
              })
          )
        );
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading models:", error);
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 768;

  const adjustPlaneForScreenSize = (): [Triple, Triple] => {
    if (isSmallScreen) {
      return [[1.5, 1.5, 1.5], [0, -1.5, 0]];
    }
    return [[3, 3, 3], [0, -4, -4]];
  };

  const adjustIslandForScreenSize = (): [Triple, Triple, Triple] => {
    const screenPosition: Triple = [0, -6.5, -43];
    const rotation: Triple = [0.1, 4.7, 0];
    const screenScale: Triple = isSmallScreen ? [0.9, 0.9, 0.9] : [1, 1, 1];
    return [screenScale, screenPosition, rotation];
  };

  const [planeScale, planePosition] = adjustPlaneForScreenSize();
  const [islandScale, islandPostition, islandRotation] = adjustIslandForScreenSize();

  return (
    <section className="w-full h-screen relative">
      <div className="absolute top-28 left-0 right-0 z-10 flex items-center justify-center">
        {currentStage && <HomeInfo currentStage={currentStage} />}
      </div>
      <Canvas
        className={`w-full h-screen bg-transparent ${
          isRotating ? "cursor-grabbing" : "cursor-grab"
        }`}
        camera={{ near: 0.1, far: 1000 }}
      >
        <Suspense fallback={<Loader />}>
          <directionalLight position={[1, 1, 1]} intensity={1.2} />
          <ambientLight intensity={0.1} />
          <pointLight />
          <spotLight />
          <hemisphereLight color="#b1e1ff" groundColor="#dbeafe" intensity={1} />
          <Sky isRotating={isRotating} />
          <Bird />
          <Island
            isRotating={isRotating}
            setIsRotating={setIsRotating}
            setCurrentStage={setCurrentStage}
            position={islandPostition}
            rotation={islandRotation}
            scale={islandScale}
          />
          <Plane
            isRotating={isRotating}
            scale={planeScale}
            position={planePosition}
            rotation={[0, 20, 0]}
          />
        </Suspense>
      </Canvas>
    </section>
  );
};

export default HomeScene;

// Preload all models
useGLTF.preload(islandScene);
useGLTF.preload(skyScene);
useGLTF.preload(birdScene);
useGLTF.preload(planeScene);
