"use client";

import { useEffect, useRef, type RefObject } from "react";

type Props = {
  variant: "margin" | "field" | "syntax";
  paused: boolean;
  gravityRef?: RefObject<{ x: number; y: number }>;
};

type Drop = {
  key: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  speed: number;
  depth: number;
  size: number;
  length: number;
  padding: number;
};

type Scene = {
  variant: Props["variant"];
  width: number;
  height: number;
  drops: Drop[];
};

const GLYPHS = "abcdefghjkmnprstuvxyz0123456789.:/{}[]+−";
const FRAGMENTS = ["await", "return", "{ }", "[ ]", "=>", "0 · 1", "...", "()", "const", "if", "</>"];
const COLORS = ["#65796f", "#71818a", "#83877d"];
const FONT = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

// Throwaway study: sparse margin trails, an open glyph field, and horizontal syntax.
function seed(value: number) {
  let n = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function smooth(from: number, to: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export default function PrototypeRainCanvas({ variant, paused, gravityRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A pause or tab change must preserve both position and momentum.
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;
    let focused = document.hasFocus();

    function gravity() {
      const value = gravityRef?.current ?? { x: 0, y: 1 };
      const magnitude = Math.max(1, Math.hypot(value.x, value.y));
      return { x: value.x / magnitude, y: value.y / magnitude };
    }

    function populate() {
      const g = gravity();
      const count = variant === "margin"
        ? width < 700 ? 8 : 16
        : variant === "field"
          ? Math.max(17, Math.min(56, Math.floor((width * height) / 25000)))
          : width < 700 ? 13 : 26;
      const drops = Array.from({ length: count }, (_, i): Drop => {
        const key = variant === "margin" ? i * 173 + 11 : variant === "field" ? i * 251 + 53 : i * 307 + 97;
        const depth = seed(key + 1);
        const size = (variant === "syntax" ? 9 : 10) + depth * 3;
        const length = variant === "margin"
          ? 5 + Math.floor(seed(key + 2) * 9)
          : variant === "field" ? 1 + Math.floor(seed(key + 4) * 4) : 1;
        const speed = 10 + depth * (variant === "margin" ? 8 : variant === "field" ? 7 : 6);
        const right = i >= count / 2;
        const lane = i % (count / 2);
        const x = variant === "margin"
          ? right
            ? width * (0.805 + (lane / (count / 2)) * 0.175)
            : width * (0.02 + (lane / (count / 2)) * 0.10)
          : 14 + seed(key + 2) * Math.max(0, width - (variant === "syntax" ? 72 : 28));
        return {
          key, depth, size, length, speed, x,
          y: seed(key + 3) * height,
          vx: g.x * speed,
          vy: g.y * speed,
          heading: Math.hypot(g.x, g.y) > 0.01 ? Math.atan2(g.y, g.x) : Math.PI / 2,
          padding: variant === "margin" ? length * size * 1.65 + 24 : variant === "field" ? length * 18 + 24 : 80,
        };
      });
      sceneRef.current = { variant, width, height, drops };
    }

    function advance(dt: number) {
      const scene = sceneRef.current;
      if (!scene || !width || !height) return;
      const g = gravity();
      // dv/dt = gravity * speed * drag - velocity * drag.
      // Exact integration gives gentle inertia, bounded speed, and a soft stop when flat.
      const drag = 1.8;
      const decay = Math.exp(-drag * dt);
      for (const drop of scene.drops) {
        const targetX = g.x * drop.speed;
        const targetY = g.y * drop.speed;
        drop.x += targetX * dt + (drop.vx - targetX) * (1 - decay) / drag;
        drop.y += targetY * dt + (drop.vy - targetY) * (1 - decay) / drag;
        drop.vx = targetX + (drop.vx - targetX) * decay;
        drop.vy = targetY + (drop.vy - targetY) * decay;
        if (Math.hypot(drop.vx, drop.vy) > 0.2) {
          const angle = Math.atan2(drop.vy, drop.vx) - drop.heading;
          const shortestTurn = Math.atan2(Math.sin(angle), Math.cos(angle));
          drop.heading += shortestTurn * (1 - Math.exp(-3 * dt));
        }
        // Full trail padding prevents a visible pop when recycling in any direction.
        // Both axes wrap independently, including sideways and upside-down gravity.
        const spanX = width + drop.padding * 2;
        const spanY = height + drop.padding * 2;
        drop.x = ((drop.x + drop.padding) % spanX + spanX) % spanX - drop.padding;
        drop.y = ((drop.y + drop.padding) % spanY + spanY) % spanY - drop.padding;
      }
    }

    function inkAt(x: number, y: number) {
      const relativeX = x / width;
      // Leave a quiet reading area; the thin perimeter carries almost all the ink.
      const left = 1 - smooth(0.035, width < 700 ? 0.16 : 0.15, relativeX);
      const right = smooth(width < 700 ? 0.84 : 0.75, 0.985, relativeX);
      const perimeter = Math.max(left, right);
      const verticalFade = smooth(0, 100, y) * (1 - smooth(height - 120, height, y));
      return (0.23 + 0.77 * perimeter) * verticalFade;
    }

    function glyph(text: string, x: number, y: number, size: number, opacity: number, color: number) {
      if (!context || y < -size || y > height + size) return;
      context.font = `${size}px ${FONT}`;
      context.fillStyle = COLORS[color % COLORS.length];
      context.globalAlpha = opacity * inkAt(x, y);
      context.fillText(text, x, y);
    }

    function paint() {
      if (!context || !width || !height) return;
      context.clearRect(0, 0, width, height);
      context.textBaseline = "middle";
      const drops = sceneRef.current?.drops ?? [];

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const { key, depth, size, length, x, y } = drop;
        const dx = Math.cos(drop.heading);
        const dy = Math.sin(drop.heading);
        if (variant === "margin") {
          // Trails turn behind their velocity; the letterforms stay upright.
          for (let row = 0; row < length; row++) {
            const character = GLYPHS[Math.floor(seed(key + row * 31 + 17) * GLYPHS.length)];
            const tailFade = 0.28 + 0.72 * Math.pow(1 - row / length, 1.2);
            const distance = row * size * 1.65;
            glyph(character, x - dx * distance, y - dy * distance, size, (0.16 + depth * 0.08) * tailFade, i);
          }
        } else if (variant === "field") {
          // Separated glyph clusters turn as a constellation with lateral breathing room.
          for (let part = 0; part < length; part++) {
            const character = GLYPHS[Math.floor(seed(key + part * 43 + 5) * GLYPHS.length)];
            const lateral = part === 0 ? 0 : (seed(key + part * 67) - 0.5) * 21;
            glyph(character, x - dx * part * 18 + dy * lateral, y - dy * part * 18 - dx * lateral, size, (0.14 + depth * 0.08) * (1 - part * 0.17), i);
          }
        } else {
          // Syntax remains horizontal while its whole fragment falls toward the ground.
          const fragment = FRAGMENTS[Math.floor(seed(key + 4) * FRAGMENTS.length)];
          glyph(fragment, x, y, size, 0.15 + depth * 0.08, i);
        }
      }

      context.globalAlpha = 1;
    }

    function animate(time: number) {
      frame = window.requestAnimationFrame(animate);
      if (!previousTime) previousTime = time;
      const delta = time - previousTime;
      if (delta < 50) return;
      advance(Math.min(delta / 1000, 0.1));
      previousTime = time;
      paint();
    }

    function syncPlayback() {
      window.cancelAnimationFrame(frame);
      previousTime = 0;
      paint();
      if (!paused && !motion.matches && !document.hidden && focused) {
        frame = window.requestAnimationFrame(animate);
      }
    }

    function resize() {
      if (!canvas || !context) return;
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const scene = sceneRef.current;
      if (!scene || scene.variant !== variant) {
        populate();
      } else if (scene.width !== width || scene.height !== height) {
        // Rotation and mobile browser chrome can resize the canvas mid-fall.
        // Reframe existing positions while keeping each drop's momentum and heading.
        const scaleX = width / scene.width;
        const scaleY = height / scene.height;
        for (const drop of scene.drops) {
          drop.x *= scaleX;
          drop.y *= scaleY;
        }
        scene.width = width;
        scene.height = height;
      }
      paint();
    }

    function onFocus() {
      focused = true;
      syncPlayback();
    }

    function onBlur() {
      focused = false;
      syncPlayback();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    syncPlayback();
    motion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, [variant, paused, gravityRef]);

  return <canvas ref={canvasRef} className="prototype-rain-canvas" aria-hidden="true" />;
}
