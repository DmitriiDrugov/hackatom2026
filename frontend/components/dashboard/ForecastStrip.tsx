import type { ForecastSeries, ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";

const chartColors = {
  electricityPrice: "#2563eb",
  danubeTemperature: "#f59e0b",
  heatDemand: "#0891b2",
};

export function ForecastStrip({ data }: { data: ScenarioPayload }) {
  return (
    <section className="dashboard-card grid min-h-0 grid-cols-[1fr_1px_1fr_1px_1fr] overflow-hidden">
      <ForecastPanel
        series={data.forecasts.electricityPrice}
        color={data.forecasts.electricityPrice.current < 0 ? "#ef4444" : chartColors.electricityPrice}
      />
      <div aria-hidden className="w-px bg-app-border" />
      <ForecastPanel
        series={data.forecasts.danubeTemperature}
        color={data.danube.status === "crit" ? "#ef4444" : chartColors.danubeTemperature}
      />
      <div aria-hidden className="w-px bg-app-border" />
      <ForecastPanel series={data.forecasts.heatDemand} color={chartColors.heatDemand} />
    </section>
  );
}

function ForecastPanel({ series, color }: { series: ForecastSeries; color: string }) {
  const values = series.points.map((point) => point.value);
  const min = Math.min(...values, series.limit ?? Number.POSITIVE_INFINITY);
  const max = Math.max(...values, series.limit ?? Number.NEGATIVE_INFINITY);
  const pad = (max - min || 1) * 0.14;
  const width = 360;
  const height = 92;
  const y = (value: number) =>
    height - ((value - min + pad) / (max - min + pad * 2)) * height * 0.86 - height * 0.07;
  const x = (hour: number) => (hour / 47) * width;
  const points = series.points
    .map((point) => `${x(point.hour).toFixed(1)},${y(point.value).toFixed(1)}`)
    .join(" ");
  const area = `${points} ${width},${height} 0,${height}`;
  const markerX = x(24);
  const markerY = y(series.points[24].value);
  const currentLabel =
    series.unit === "°C"
      ? `${series.current.toFixed(1)}°C`
      : series.unit === "MW"
        ? `${series.current.toFixed(0)} MW`
        : `${series.current > 0 ? "+" : ""}${series.current.toFixed(0)} €/MWh`;

  const slug = series.label.replace(/\s+/g, "-").toLowerCase();
  const statusColor = colorForStatus(series.status);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden">
      <div
        className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-app-border px-5"
        style={{ backgroundColor: `${color}0d` }}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-3 w-[2px] rounded-full" style={{ backgroundColor: color }} />
          <span className="panel-title text-[12px]">{series.label}</span>
        </div>
        <span
          className="mono shrink-0 text-[13px] font-medium tabular-nums"
          style={{ color: statusColor }}
        >
          {currentLabel}
        </span>
      </div>
      <div className="min-h-0 flex-1 px-4 pb-3">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id={`fill-${slug}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <pattern id={`future-${slug}`} width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0,6 L6,0" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
            </pattern>
          </defs>

          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1="0"
              x2={width}
              y1={height * t}
              y2={height * t}
              stroke="rgba(148, 163, 184, 0.18)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          ))}

          <rect x={markerX} y="0" width={width - markerX} height={height} fill={`url(#future-${slug})`} />

          <polygon points={area} fill={`url(#fill-${slug})`} />

          {series.limit != null ? (
            <line
              x1="0"
              x2={width}
              y1={y(series.limit)}
              y2={y(series.limit)}
              stroke="var(--rose)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          ) : null}

          <line
            x1={markerX}
            x2={markerX}
            y1="0"
            y2={height}
            stroke="rgba(15,23,42,0.35)"
            strokeWidth="1"
          />

          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle cx={markerX} cy={markerY} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
