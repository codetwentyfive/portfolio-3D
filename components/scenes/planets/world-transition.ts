export const WORLD_EXIT_MS = 180;
export const WORLD_ENTER_MS = 460;
export const WORLD_LOAD_MS = 15000;

export type WorldTransition = {
  current: number;
  target: number;
  direction: "next" | "previous";
  phase: "idle" | "loading" | "exiting" | "entering";
  failed: boolean;
};
export type WorldTransitionAction =
  | { type: "request"; index: number; direction: WorldTransition["direction"] }
  | { type: "prepared"; index: number; reduced: boolean }
  | { type: "advance"; phase: WorldTransition["phase"] }
  | { type: "restore"; index: number }
  | { type: "reduce" }
  | { type: "timeout" };

export function initialWorldTransition(index = 0): WorldTransition {
  return {
    current: index,
    target: index,
    direction: "next",
    phase: "idle",
    failed: false,
  };
}

export function worldTransition(
  state: WorldTransition,
  action: WorldTransitionAction,
): WorldTransition {
  switch (action.type) {
    case "request":
      // One deliberate move at a time; repeated taps cannot skip or tear the scene.
      if (state.phase !== "idle" || action.index === state.current)
        return state;
      return {
        ...state,
        target: action.index,
        direction: action.direction,
        phase: "loading",
        failed: false,
      };
    case "prepared":
      if (state.phase !== "loading" || action.index !== state.target)
        return state;
      return action.reduced
        ? { ...state, current: state.target, phase: "idle" }
        : { ...state, phase: "exiting" };
    case "advance":
      if (state.phase !== action.phase) return state;
      if (state.phase === "exiting")
        return { ...state, current: state.target, phase: "entering" };
      if (state.phase === "entering") return { ...state, phase: "idle" };
      return state;
    case "restore":
      return initialWorldTransition(action.index);
    case "reduce":
      return state.phase === "exiting" || state.phase === "entering"
        ? { ...state, current: state.target, phase: "idle" }
        : state;
    case "timeout":
      return state.phase === "loading"
        ? { ...state, target: state.current, phase: "idle", failed: true }
        : state;
  }
}
