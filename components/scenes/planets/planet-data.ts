import { projects } from "@/constants";

export type GerStyle = "paint" | "blueprint" | "alloy" | "clay";
export const gerStyles: GerStyle[] = ["paint", "blueprint", "alloy", "clay"];
export type PlanetKind =
  "shop" | "payments" | "portfolio" | "seeds" | "potera" | "assistant";

// Resolve by project identity, never by the catalog's display order.
const worlds: { projectName: string; kind: PlanetKind }[] = [
  { kind: "shop", projectName: "chingis.shop" },
  { kind: "payments", projectName: "E-Commerce Data & Payments" },
  { kind: "portfolio", projectName: "3D Portfolio" },
  { kind: "seeds", projectName: "The Strange Seeds" },
  { kind: "potera", projectName: "Potera Cleaning" },
  { kind: "assistant", projectName: "Self-Hosted AI Assistant" },
];

export const planets = worlds.flatMap((world, index) => {
  const project = projects.find((entry) => entry.name.en === world.projectName);
  return project
    ? [{ ...project, ...world, number: String(index + 1).padStart(2, "0") }]
    : [];
});
