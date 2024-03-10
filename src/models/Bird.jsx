import React, { useRef, useEffect } from "react";
import birdScene from "../assets/3d/bird.glb";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
const Bird = () => {
  const birdRef = useRef();
  //grab the animations using useGLTF
  const { scene, animations } = useGLTF(birdScene);
  //useAnimations defined as actions used
  const { actions } = useAnimations(animations, birdRef);

  useEffect(() => {
    actions["Take 001"].play();
  }, []);
  useFrame(({ clock, camera }) => {
    //update the y postition to simulate the bird flying in a sin wave
    birdRef.current.position.y = Math.sin(clock.elapsedTime) * 0.2 + 2;
    //check if bird has reached the end of the screen
    if (birdRef.current.position.x > camera.position.x + 10) {
      //change direction  to backwards and rotate the bird 180 degrees on the y-axis
      birdRef.current.rotation.y = Math.PI;
      //if it hasnt reached the end of the screen->
      //move it forwards
    } else if (birdRef.current.position.x < camera.position.x - 10) {
      birdRef.current.rotation.y = 0;
    }
    //update x,y positions based opn the direction
    if (birdRef.current.rotation.y === 0) {
      //moving forward
      birdRef.current.position.x += 0.01;
      birdRef.current.position.z -= 0.01;
    } else {
      //moving backwards
      birdRef.current.position.x -= 0.01;
      birdRef.current.position.z += 0.01;
    }
  });

  return (
    <mesh position={[-5, 2, 1]} scale={[0.003, 0.003, 0.003]} ref={birdRef}>
      <primitive object={scene} />
    </mesh>
  );
};

export default Bird;
