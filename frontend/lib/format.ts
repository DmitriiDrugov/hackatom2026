export const mwFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const compactFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export const euroFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatMw(value: number) {
  return `${mwFormatter.format(value)} MW`;
}

export function formatEuro(value: number) {
  return `€${euroFormatter.format(value)}`;
}

export function formatSignedEuro(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}€${euroFormatter.format(Math.abs(value))}`;
}

export function formatTemp(value: number) {
  return `${value.toFixed(1)}°C`;
}

export function formatPct(value: number, signed = false) {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(0)}%`;
}

export function colorForStatus(status: "ok" | "warn" | "crit" | "off") {
  if (status === "ok") return "#34d399";
  if (status === "warn") return "#fbbf24";
  if (status === "crit") return "#fb7185";
  return "#2d3748";
}

export function colorForChannel(channel: string) {
  if (channel === "electricity") return "#38bdf8";
  if (channel === "heat") return "#34d399";
  if (channel === "hydrogen") return "#c084fc";
  return "#2d3f5a";
}
