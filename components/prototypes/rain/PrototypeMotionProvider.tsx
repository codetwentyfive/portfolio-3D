"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPrototypeMotion, type PrototypeMotion } from "./prototype-motion";

const MotionContext = createContext<PrototypeMotion | null>(null);

export default function PrototypeMotionProvider({ children }: { children: ReactNode }) {
  const [motion] = useState(createPrototypeMotion);
  return <MotionContext.Provider value={motion}>{children}</MotionContext.Provider>;
}

export function usePrototypeMotion() {
  return useContext(MotionContext);
}
