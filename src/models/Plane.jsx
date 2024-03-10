import React, { useEffect,useRef } from "react";
import planeScene from "../assets/3d/plane.glb";
import { useAnimations, useGLTF } from "@react-three/drei";
const Plane = ({ isRotating, ...props }) => {
  const ref = useRef();
  const { scene, animations } = useGLTF(planeScene);
  //Use animations from drei helper functions
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    if (isRotating) {
      /*Telling the pplane to use the animation "Take 001" to play
      when isRotating is active*/
      actions["Take 001"].play();
    } else {
      actions["Take 001"].stop();
    }
    //useEffect applies when actions or isRotating is triggered
  }, [actions, isRotating]);
  return (
    <mesh {...props} ref={ref}>
      <primitive object={scene} />
    </mesh>
  );
};

export default Plane;
