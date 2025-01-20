import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import Loader from "../components/Loader";
import { LoadingScreen } from "../components/LoadingScreen";
import Island from "../models/Island";
import Sky from "../models/Sky";
import Bird from "../models/Bird";
import Plane from "../models/Plane";
import HomeInfo from "../components/HomeInfo";
import islandScene from "../assets/3d/island.glb";
import skyScene from "../assets/3d/sky.glb";
import birdScene from "../assets/3d/bird.glb";
import planeScene from "../assets/3d/plane.glb";

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState(1);
  const [isRotating, setIsRotating] = useState(false);

  // Preload all models
  useEffect(() => {
    const loadModels = async () => {
      const modelPaths = [islandScene, skyScene, birdScene, planeScene];
      
      try {
        await Promise.all(
          modelPaths.map(path => 
            new Promise((resolve, reject) => {
              useGLTF.load(
                path, 
                (gltf) => resolve(gltf),
                undefined,
                (error) => reject(error)
              );
            })
          )
        );
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  const adjustPlaneForScreenSize = () => {
    let screenScale, screenPosition;
    if (window.innerWidth < 768) {
      screenScale = [1.5, 1.5, 1.5];
      screenPosition = [0, -1.5, 0];
    } else {
      screenScale = [3, 3, 3];
      screenPosition = [0, -4, -4];
    }
    return [screenScale, screenPosition];
  };

  const adjustIslandForScreenSize = () => {
    let screenScale = null;
    let screenPosition = [0, -6.5, -43];
    let rotation = [0.1, 4.7, 0];
    if (window.innerWidth < 768) {
      screenScale = [0.9, 0.9, 0.9];
    } else {
      screenScale = [1, 1, 1];
    }
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
          <hemisphereLight skyColor="#b1e1ff" groundColor="#000000" intensity={1} />
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

export default Home;

// Preload all models
useGLTF.preload(islandScene);
useGLTF.preload(skyScene);
useGLTF.preload(birdScene);
useGLTF.preload(planeScene);
