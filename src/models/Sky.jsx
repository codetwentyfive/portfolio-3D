import { useGLTF } from "@react-three/drei";
import React, { useRef } from "react";
//useframe allows us to do something on every frame
import { useFrame } from "@react-three/fiber";

import skyScene from "../assets/3d/sky.glb";
const Sky = ({ isRotating }) => {
  const sky = useGLTF(skyScene);
  const skyRef = useRef();

  useFrame((_, delta) => {
    //animation of the sky scence rotating
    if (isRotating) {
      skyRef.current.rotation.y += 0.1 * delta;
    }
  });
  return (
    <mesh ref={skyRef}>
      {/*Primitive element*/}
      <primitive object={sky.scene} />
    </mesh>
  );
};

export default Sky;
