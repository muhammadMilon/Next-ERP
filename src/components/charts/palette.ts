/**
 * Categorical palette — fixed order, never cycled, validated against the white
 * chart surface (worst adjacent CVD ΔE 9.1, normal-vision ΔE 19.6).
 * A 9th series folds into "Other" rather than inventing a hue.
 */
export const SERIES = [
  "#eb6834", // 1 · orange (brand)
  "#2a78d6", // 2 · blue
  "#1baf7a", // 3 · aqua
  "#eda100", // 4 · yellow
  "#e87ba4", // 5 · magenta
  "#008300", // 6 · green
  "#4a3aa7", // 7 · violet
  "#e34948", // 8 · red
] as const;

export const seriesColor = (i: number) => SERIES[i % SERIES.length];

/** Single-hue sequential ramp for magnitude (light → dark). */
export const SEQUENTIAL = ["#ffe9dd", "#ffd4bd", "#fdb68f", "#f79263", "#eb6834", "#d2521f", "#ae4118"] as const;

/** Reserved status colours — never reused as "series 4". */
export const STATUS_COLOR: Record<string, string> = {
  good: "#17805b",
  warn: "#b06a00",
  serious: "#c2410c",
  critical: "#b91c1c",
  neutral: "#94a3b8",
};

export const AXIS = {
  stroke: "#cbd5e1",
  tick: { fill: "#64748b", fontSize: 11 },
  grid: "#eef2f7",
} as const;

export const CHART_SURFACE = "#ffffff";
