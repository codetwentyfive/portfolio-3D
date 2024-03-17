import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect, useRef } from "react";
import Loader from "../components/Loader";

import Island from "../models/Island";
import Sky from "../models/Sky";
import Bird from "../models/Bird";
import Plane from "../models/Plane";
import HomeInfo from "../components/HomeInfo";
import dream from "../assets/dream.mp3";
import { soundoff, soundon } from "../assets/icons";
import { OrbitControls } from "@react-three/drei";

const Home = () => {
  const audioRef = useRef(new Audio(dream));
  audioRef.current.volume = 0.4;
  audioRef.current.loop = true;
  const [currentStage, setCurrentStage] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMusicInfoVisible, setIsMusicInfoVisible] = useState(false);

  const toggleMusicInfo = () => {
    setIsMusicInfoVisible(!isMusicInfoVisible);
  };

  useEffect(() => {
    if (isPlayingMusic) {
      audioRef.current.play();
    }
    return () => {
      audioRef.current.pause();
    };
  }, [isPlayingMusic]);

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
  const [islandScale, islandPostition, islandRotation] =
    adjustIslandForScreenSize();
  return (
    <section className="w-full h-screen relative">
      <div className="absolute top-28 left-0 right-0 z-10 flex items-center justify-center ">
        {currentStage && <HomeInfo currentStage={currentStage} />}
      </div>
      <Canvas
        className={`w-full h-screen bg-transparent ${
          isRotating ? "cursor-grabbing" : "cursor-grab"
        }`}
        camera={{ near: 0.1, far: 1000 }}
      >
        <Suspense fallback={<Loader />}></Suspense>
        <directionalLight position={[1, 1, 1]} intensity={1.2} />
        <ambientLight intensity={0.1} />
        <pointLight />
        <spotLight />
        <hemisphereLight
          skyColor="#b1e1ff"
          groundColor="#000000"
          intensity={1}
        />
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
      </Canvas>
      <div className="flex flex-row gap-6 justify-center items-center absolute h-15 md:bottom-2 md:left-2 bottom-16 left-8">
        <img
          src={!isPlayingMusic ? soundoff : soundon}
          className="w-10 h-10 cursor-pointer object-contain"
          onClick={() => {
            setIsPlayingMusic(!isPlayingMusic);

            if (isPlayingMusic(true)) {
              toggleMusicInfo;
            }
          }}
        />
        <div
          className={`music-info ${
            isPlayingMusic ? "visible" : ""
          } py-1 px-2 rounded-lg`}
        >
          <p>
            Title: <span className="font-semibold">dream.mp3</span> <br />
            Artist: Chingis Enkhbaatar
          </p>
        </div>
      </div>
    </section>
  );
};

export default Home;
