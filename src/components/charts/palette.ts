/**
 * Categorical palette — fixed order, never cycled, lifted for the dark chart
 * surface so every hue clears 3:1 against it.
 * A 9th series folds into "Other" rather than inventing a hue.
 */
export const SERIES = [
  "#4d8df6", // 1 · blue
  "#f9834f", // 2 · orange
  "#38c98a", // 3 · green
  "#f0b429", // 4 · amber
  "#ef7fae", // 5 · magenta
  "#2fbfbf", // 6 · teal
  "#9b8afb", // 7 · violet
  "#f0575c", // 8 · red
] as const;

export const seriesColor = (i: number) => SERIES[i % SERIES.length];

/** Single-hue sequential ramp for magnitude (dim → bright, reading up on ink). */
export const SEQUENTIAL = ["#1c3352", "#234677", "#2a5ca3", "#3273cd", "#4d8df6", "#77a8f9", "#a5c6fb"] as const;

/** Reserved status colours — never reused as "series 4". */
export const STATUS_COLOR: Record<string, string> = {
  good: "#2fbe83",
  warn: "#e0a13a",
  serious: "#f0803c",
  critical: "#f0575c",
  neutral: "#7b8496",
};

export const AXIS = {
  stroke: "#2b3140",
  tick: { fill: "#8b94a6", fontSize: 11 },
  grid: "#212630",
} as const;

/** Cards sit on this, so slice/bar separators are drawn in it. */
export const CHART_SURFACE = "#101219";

/** The cursor wash behind a hovered bar or column. */
export const CHART_CURSOR = "#1b1f29";
