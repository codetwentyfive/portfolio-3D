import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect, useRef } from "react";
import Loader from "../components/Loader";
import { LoadingScreen } from "../components/LoadingScreen";
import Island from "../models/Island";
import Sky from "../models/Sky";
import Bird from "../models/Bird";
import Plane from "../models/Plane";
import HomeInfo from "../components/HomeInfo";
import { soundoff, soundon } from "../assets/icons";
import { useModelLoader } from "../hooks/useModelLoader";

const Home = () => {
  const modelPaths = [
    '../assets/3d/island.glb',
    '../assets/3d/sky.glb',
    '../assets/3d/bird.glb',
    '../assets/3d/plane.glb'
  ];
  
  const isLoading = useModelLoader(modelPaths);
  const audioRef = useRef(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMusicInfoVisible, setIsMusicInfoVisible] = useState(false);

  // Lazy load audio
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.4;
    audio.loop = true;
    
    // Load audio file only when needed
    const loadAudio = () => {
      if (!audioRef.current) {
        import('../assets/dream.ogg').then((module) => {
          audio.src = module.default;
          audioRef.current = audio;
        });
      }
    };

    // Load audio on first user interaction
    const handleFirstInteraction = () => {
      loadAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.play().catch(() => setIsPlayingMusic(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingMusic]);

  const toggleMusicInfo = () => {
    setIsMusicInfoVisible(!isMusicInfoVisible);
  };

  const toggleMusic = () => {
    if (!audioRef.current?.src) return; // Don't toggle if audio isn't loaded
    setIsPlayingMusic(!isPlayingMusic);
    if (isPlayingMusic) {
      toggleMusicInfo();
    }
  };

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
      <div className="flex flex-row gap-6 justify-center items-center absolute h-15 md:bottom-2 md:left-2 bottom-16 left-8">
        <img
          src={!isPlayingMusic ? soundoff : soundon}
          alt="musicplayer"
          className="w-10 h-10 cursor-pointer object-contain"
          onClick={toggleMusic}
        />
        <div
          className={`music-info ${
            isPlayingMusic ? "visible" : ""
          } py-1 px-2 rounded-lg`}
        >
          <p>
            Title: <span className="font-semibold text-yellow-200">dream.ogg</span> <br />
            Artist: Chingis
          </p>
        </div>
      </div>
    </section>
  );
};

export default Home;
