"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PrototypeGravityStatus =
  | "off" | "requesting" | "waiting" | "active"
  | "denied" | "unavailable" | "insecure";

type OrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// CSS screen coordinates: x points right, y points down. The sensor's frame
// stays in the device's natural orientation even when the viewport rotates.
function projectGravity(beta: number, gamma: number) {
  const radians = Math.PI / 180;
  const legacyAngle = (window as Window & { orientation?: number }).orientation;
  const angle = (window.screen.orientation?.angle ?? legacyAngle ?? 0) * radians;
  const x = Math.sin(gamma * radians) * Math.cos(beta * radians);
  const y = Math.sin(beta * radians);
  // Screen angles run counterclockwise from natural orientation; transform
  // the natural-device vector into the viewport with the inverse rotation.
  const screenX = Math.cos(angle) * x + Math.sin(angle) * y;
  const screenY = -Math.sin(angle) * x + Math.cos(angle) * y;
  const magnitude = Math.hypot(screenX, screenY);

  // Preserve the projection's strength: a flat phone should settle to rest.
  if (magnitude < 0.025) return { x: 0, y: 0 };
  const scale = Math.max(1, magnitude);
  return { x: screenX / scale, y: screenY / scale };
}

export default function usePrototypeGravity(suspended: boolean) {
  const gravityRef = useRef({ x: 0, y: 1 });
  const [status, setStatus] = useState<PrototypeGravityStatus>("off");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const requestRef = useRef(0);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setSupported(typeof window.DeviceOrientationEvent !== "undefined");
    return () => {
      mountedRef.current = false;
      enabledRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const disable = useCallback(() => {
    requestRef.current += 1;
    pendingRef.current = false;
    enabledRef.current = false;
    gravityRef.current = { x: 0, y: 1 };
    setEnabled(false);
    setStatus("off");
  }, []);

  // Call directly from a click handler: Safari needs that transient activation.
  // Relative orientation needs no compass, location, or motion permission call.
  const enable = useCallback(async () => {
    if (pendingRef.current || enabledRef.current) return;
    if (!window.isSecureContext) {
      setStatus("insecure");
      return;
    }
    const orientation = window.DeviceOrientationEvent as OrientationWithPermission | undefined;
    if (!orientation) {
      setSupported(false);
      setStatus("unavailable");
      return;
    }

    const request = ++requestRef.current;
    pendingRef.current = true;
    setStatus("requesting");
    try {
      // Nothing asynchronous may precede this permission request.
      const permission = typeof orientation.requestPermission === "function"
        ? await orientation.requestPermission()
        : "granted";
      if (!mountedRef.current || request !== requestRef.current) return;
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      enabledRef.current = true;
      setEnabled(true);
      setStatus("waiting");
    } catch (error) {
      if (!mountedRef.current || request !== requestRef.current) return;
      setStatus(error instanceof DOMException && error.name === "NotAllowedError"
        ? "denied" : "unavailable");
    } finally {
      if (request === requestRef.current) pendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || suspended) return;

    let attached = false;
    let received = false;
    let timer: number | undefined;
    let latest: { beta: number; gamma: number } | undefined;

    const onRotation = () => {
      if (latest && enabledRef.current) {
        gravityRef.current = projectGravity(latest.beta, latest.gamma);
      }
    };
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (!enabledRef.current || event.beta === null || event.gamma === null
        || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
      latest = { beta: event.beta, gamma: event.gamma };
      onRotation();
      if (!received) {
        received = true;
        window.clearTimeout(timer);
        setStatus("active");
      }
    };
    const detach = () => {
      window.clearTimeout(timer);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("orientationchange", onRotation);
      window.screen.orientation?.removeEventListener("change", onRotation);
      attached = false;
    };
    const syncVisibility = () => {
      if (document.hidden || !enabledRef.current) {
        detach();
        return;
      }
      if (attached) return;
      attached = true;
      received = false;
      setStatus("waiting");
      window.addEventListener("deviceorientation", onOrientation);
      window.addEventListener("orientationchange", onRotation);
      window.screen.orientation?.addEventListener("change", onRotation);
      timer = window.setTimeout(() => {
        detach();
        enabledRef.current = false;
        gravityRef.current = { x: 0, y: 1 };
        setEnabled(false);
        setStatus("unavailable");
      }, 4_000);
    };

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      detach();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [enabled, suspended]);

  return { gravityRef, status, supported, enabled, enable, disable };
}
