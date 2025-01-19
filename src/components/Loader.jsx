import { Html, useProgress } from "@react-three/drei";

const Loader = () => {
  const { progress } = useProgress();
  
  return (
    <Html
      as='div'
      center
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        transform: "translate(-50%, -50%)"
      }}
    >
      <div className="w-20 h-20 border-2 border-opacity-20 border-blue-500 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-500 mt-4 font-medium">
        {progress.toFixed(0)}%
      </p>
    </Html>
  );
};

export default Loader;
