export const mwFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const compactFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export const euroFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

// Formats power values for dense dashboard labels.
export function formatMw(value: number) {
  return `${mwFormatter.format(value)} MW`;
}

// Formats unsigned euro values for metrics and explanation rows.
export function formatEuro(value: number) {
  return `€${euroFormatter.format(value)}`;
}

// Formats signed euro deltas for optimization gains and scenario deltas.
export function formatSignedEuro(value: number) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}€${euroFormatter.format(Math.abs(value))}`;
}

// Formats Celsius values with one decimal for river and forecast displays.
export function formatTemp(value: number) {
  return `${value.toFixed(1)}°C`;
}

// Formats percentages with optional positive sign for deltas.
export function formatPct(value: number, signed = false) {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(0)}%`;
}

// Maps semantic safety status to the dashboard color system (light theme).
export function colorForStatus(status: "ok" | "warn" | "crit" | "off") {
  if (status === "ok") return "#10b981";
  if (status === "warn") return "#f59e0b";
  if (status === "crit") return "#ef4444";
  return "#94a3b8";
}

// Maps allocation channels to stable chart colors (light theme).
export function colorForChannel(channel: string) {
  if (channel === "electricity") return "#2563eb";
  if (channel === "heat") return "#059669";
  if (channel === "hydrogen") return "#7c3aed";
  return "#0891b2";
}
