import type { ForecastSeries, ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";

const chartColors = {
  electricityPrice: "#38bdf8",
  danubeTemperature: "#fbbf24",
  heatDemand: "#38bdf8",
};

export function ForecastStrip({ data }: { data: ScenarioPayload }) {
  return (
    <section className="grid min-h-0 grid-cols-3 overflow-hidden border-t border-app-border bg-app-surface">
      <ForecastPanel series={data.forecasts.electricityPrice} color={data.forecasts.electricityPrice.current < 0 ? "#fb7185" : chartColors.electricityPrice} />
      <ForecastPanel series={data.forecasts.danubeTemperature} color={data.danube.status === "crit" ? "#fb7185" : chartColors.danubeTemperature} />
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
  const y = (value: number) => height - ((value - min + pad) / (max - min + pad * 2)) * height * 0.88 - height * 0.05;
  const x = (hour: number) => (hour / 47) * width;
  const points = series.points.map((point) => `${x(point.hour).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const area = `${points} ${width},${height} 0,${height}`;
  const markerX = x(24);
  const currentLabel =
    series.unit === "°C"
      ? `${series.current.toFixed(1)}°C`
      : series.unit === "MW"
        ? `${series.current.toFixed(0)} MW`
        : `${series.current > 0 ? "+" : ""}${series.current.toFixed(0)} €/MWh`;

  return (
    <div className="flex min-w-0 flex-col overflow-hidden border-r border-app-border last:border-r-0">
      <div className="flex h-8 items-center justify-between border-b border-app-border px-3">
        <span className="panel-label truncate">{series.label}</span>
        <span className="mono ml-3 shrink-0 text-[12px]" style={{ color: colorForStatus(series.status) }}>
          {currentLabel}
        </span>
      </div>
      <div className="min-h-0 flex-1 px-1.5 py-1">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id={`fill-${series.label.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill={`url(#fill-${series.label.replace(/\s+/g, "-")})`} />
          {series.limit != null ? (
            <line
              x1="0"
              x2={width}
              y1={y(series.limit)}
              y2={y(series.limit)}
              stroke="#fb7185"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.75"
            />
          ) : null}
          <line x1={markerX} x2={markerX} y1="0" y2={height} stroke="#64748b" strokeWidth="1" opacity="0.55" />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={markerX} cy={y(series.points[24].value)} r="3" fill={color} stroke="#111827" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
