import type { PlanetKind } from "./planet-data";

export default function WorldGlyph({ kind }: { kind: PlanetKind }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="h-7 w-7"
    >
      {kind === "shop" ? (
        <>
          <path d="m3 11 7-6h4l7 6v9H3Z" />
          <path d="M3 11h18M10 5V3h4v2M10 20v-6h4v6" />
        </>
      ) : kind === "seeds" ? (
        <>
          <circle cx="12" cy="15" r="5" />
          <path d="M5 6v10M2.5 6h5M19 6v10M16.5 6h5M9 21l1-1m4 0 1 1M10 4l4 4m0-4-4 4" />
        </>
      ) : kind === "portfolio" ? (
        <>
          <path d="m7 12 5-9 5 9H7ZM8 12v9h8v-9M4 21h16" />
          <path d="M11 21v-5h2v5" />
        </>
      ) : kind === "payments" ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18M6 15h4" />
        </>
      ) : kind === "potera" ? (
        <>
          <path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z" />
          <path d="M8.5 15a3.5 3.5 0 0 0 3.5 3.5" />
        </>
      ) : (
        <>
          <rect x="5" y="3" width="14" height="18" rx="1" />
          <path d="M5 12h14M8 7.5h4M8 16.5h4" />
          <circle cx="16" cy="7.5" r=".75" fill="currentColor" stroke="none" />
          <circle cx="16" cy="16.5" r=".75" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

export function ControlGlyph({
  name,
}: {
  name:
    | "reset"
    | "pause"
    | "play"
    | "enter"
    | "cycle"
    | "left"
    | "right"
    | "settings"
    | "zoom";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      {name === "zoom" ? (
        <>
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 5 5M7 10h6m-3-3v6" />
        </>
      ) : name === "settings" ? (
        <path d="M4 7h4m4 0h8M4 17h8m4 0h4M8 4v6m8 4v6" />
      ) : name === "reset" ? (
        <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
      ) : name === "pause" ? (
        <path d="M9 5v14M15 5v14" strokeWidth="3" />
      ) : name === "play" ? (
        <path d="m8 4 12 8-12 8V4Z" fill="currentColor" stroke="none" />
      ) : name === "enter" ? (
        <path d="M5 19 19 5M5 5h14v14" />
      ) : name === "cycle" ? (
        <>
          <path d="M4 9a8 8 0 0 1 14-3l2 3M20 3v6h-6M20 15a8 8 0 0 1-14 3l-2-3m0 6v-6h6" />
        </>
      ) : (
        <path
          d={name === "left" ? "M20 12H4m6-6-6 6 6 6" : "M4 12h16m-6-6 6 6-6 6"}
        />
      )}
    </svg>
  );
}
