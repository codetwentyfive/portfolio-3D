import { useGLTF } from "@react-three/drei";
import React from "react";

import skyScene from "../assets/3d/sky.glb";
const Sky = () => {
  const sky = useGLTF(skyScene);
  return (
    <mesh>
      {/*Primitive element*/}
      <primitive object={sky.scene} />
    </mesh>
  );
};

export default Sky;
