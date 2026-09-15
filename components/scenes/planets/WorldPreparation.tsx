"use client";

import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { planets } from "./planet-data";
import worldVersions from "@/assets/world-versions.json";

function Asset({ url }: { url: string }) {
  useGLTF(url);
  return null;
}

function Prepared({
  index,
  onPrepared,
}: {
  index: number;
  onPrepared: (index: number) => void;
}) {
  useEffect(() => onPrepared(index), [index, onPrepared]);
  return null;
}

export default function WorldPreparation({
  index,
  onPrepared,
}: {
  index: number;
  onPrepared: (index: number) => void;
}) {
  const kind = planets[index].kind;
  const urls =
    kind === "shop"
      ? [`/3d/shop/atelier-v${worldVersions.shop}.glb`]
      : [
          kind === "portfolio"
            ? "/3d/island.glb"
            : `/3d/worlds/${kind}-v${worldVersions[kind]}.glb`,
        ];
  // Commit the ready marker only after every asset resolves in the shared GLTF cache.
  // Nothing is rendered, and the outgoing world stays visible while this suspends.
  return (
    <Suspense fallback={null}>
      {urls.map((url) => (
        <Asset key={url} url={url} />
      ))}
      <Prepared index={index} onPrepared={onPrepared} />
    </Suspense>
  );
}
