import { useGLTF } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import skyScene from "../assets/3d/sky.glb";
import skySceneHQ from "../assets/3d/sky-hq.glb";

const Sky = ({ isRotating }) => {
  const skyRef = useRef();
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  
  // Load low-res version immediately
  const { scene: lowResScene } = useGLTF(skyScene, true, {
    draco: true,
    keepMeshes: true
  });

  // Load high-res version in the background
  useEffect(() => {
    let mounted = true;

    const loadHighQuality = async () => {
      try {
        const { scene: highResScene } = await useGLTF(skySceneHQ, true, {
          draco: true,
          keepMeshes: true
        });

        if (mounted) {
          // Replace the scene's material and textures
          skyRef.current.children[0].material = highResScene.children[0].material;
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
    if (isRotating) {
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

// Preload both versions
useGLTF.preload(skyScene);
useGLTF.preload(skySceneHQ);
