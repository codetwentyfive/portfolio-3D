const paths = {
  sound: "M4 10v4m4-7v10m4-13v16m4-13v10m4-7v4",
  close: "m6 6 12 12M18 6 6 18",
  expand: "m8 10 4 4 4-4",
  pause: "M9 5v14M15 5v14",
  previous: "M5 5v14m14-14-10 7 10 7V5Z",
  next: "M19 5v14M5 5l10 7-10 7V5Z",
  repeat:
    "m17 3 4 4-4 4M3 11V9a2 2 0 0 1 2-2h16M7 21l-4-4 4-4m14 0v2a2 2 0 0 1-2 2H3",
  external: "M14 4h6v6m0-6L10 14M10 4H4v16h16v-6",
};

export default function AudioGlyph({
  name,
}: {
  name: keyof typeof paths | "play";
}) {
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
      className="h-5 w-5"
    >
      {name === "play" ? (
        <path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none" />
      ) : (
        <path d={paths[name]} />
      )}
    </svg>
  );
}
