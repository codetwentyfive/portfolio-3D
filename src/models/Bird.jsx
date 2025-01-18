import { useRef, useEffect } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import birdScene from "../assets/3d/bird.glb";

const Bird = () => {
  const birdRef = useRef();
  
  const { scene, animations } = useGLTF(birdScene, true, {
    draco: true,
    keepMeshes: true
  });
  
  const { actions } = useAnimations(animations, birdRef);

  useEffect(() => {
    if (actions["Take 001"]) {
      actions["Take 001"].play();
    }

    return () => {
      // Cleanup animations
      Object.values(actions).forEach(action => action?.stop());
    };
  }, [actions]);

  useFrame(({ clock, camera }) => {
    if (!birdRef.current) return;

    // Flying motion
    birdRef.current.position.y = Math.sin(clock.elapsedTime) * 0.2 + 2;

    // Direction changes
    if (birdRef.current.position.x > camera.position.x + 10) {
      birdRef.current.rotation.y = Math.PI;
    } else if (birdRef.current.position.x < camera.position.x - 10) {
      birdRef.current.rotation.y = 0;
    }

    // Movement
    const moveSpeed = 0.01;
    if (birdRef.current.rotation.y === 0) {
      birdRef.current.position.x += moveSpeed;
      birdRef.current.position.z -= moveSpeed;
    } else {
      birdRef.current.position.x -= moveSpeed;
      birdRef.current.position.z += moveSpeed;
    }
  });

  return (
    <mesh ref={birdRef} position={[-5, 2, 1]} scale={[0.003, 0.003, 0.003]}>
      <primitive object={scene} />
    </mesh>
  );
};

export default Bird;

// Preload the model
useGLTF.preload(birdScene);
