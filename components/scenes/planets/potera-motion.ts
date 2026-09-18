export const POTERA_CLEANING_DURATION = 2.9;
export const POTERA_PANE = { width: 1.38, height: .94, bladeWidth: 1.34 } as const;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** One continuous downward pass; the cleaned area never becomes dirty during a pass. */
export function samplePoteraCleaning(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : POTERA_CLEANING_DURATION;
  const cleaned = smooth((time - .20) / 1.82);
  const entry = smooth(time / .18);
  const exit = smooth((time - 2.04) / .40);
  const sheenProgress = clamp((time - 2.02) / .82);
  return {
    active: time < POTERA_CLEANING_DURATION,
    cleaned,
    bladeY: .445 - cleaned * .89,
    toolOpacity: entry * (1 - exit),
    toolZ: exit * .055,
    sheenProgress,
    sheen: Math.sin(Math.PI * sheenProgress) ** 2 * .19,
  };
}
