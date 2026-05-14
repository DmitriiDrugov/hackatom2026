import clsx from "clsx";

import type { ForecastSeries, ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";

const chartColors = {
  electricityPrice: "#2563eb",
  danubeTemperature: "#f59e0b",
  heatDemand: "#0891b2",
};

export function ForecastStrip({
  data,
  expanded = false,
}: {
  data: ScenarioPayload;
  expanded?: boolean;
}) {
  const panels = [
    {
      key: "electricity",
      series: data.forecasts.electricityPrice,
      color: data.forecasts.electricityPrice.current < 0 ? "#ef4444" : chartColors.electricityPrice,
    },
    {
      key: "danube",
      series: data.forecasts.danubeTemperature,
      color: data.danube.status === "crit" ? "#ef4444" : chartColors.danubeTemperature,
    },
    {
      key: "heat",
      series: data.forecasts.heatDemand,
      color: chartColors.heatDemand,
    },
  ];

  if (expanded) {
    return (
      <section className="grid min-h-[620px] grid-rows-3 gap-3 xl:h-full xl:min-h-0 xl:overflow-hidden">
        {panels.map((panel) => (
          <div key={panel.key} className="dashboard-card flex min-h-0 flex-col">
            <ForecastPanel series={panel.series} color={panel.color} expanded />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="dashboard-card grid min-h-[236px] grid-rows-3 overflow-hidden xl:min-h-0">
      {panels.map((panel, index) => (
        <ForecastPanel
          key={panel.key}
          series={panel.series}
          color={panel.color}
          compact
          separated={index > 0}
        />
      ))}
    </section>
  );
}

function ForecastPanel({
  series,
  color,
  expanded = false,
  compact = false,
  separated = false,
}: {
  series: ForecastSeries;
  color: string;
  expanded?: boolean;
  compact?: boolean;
  separated?: boolean;
}) {
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
  const chart = (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={`fill-${slug}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
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
          stroke="rgba(148, 163, 184, 0.22)"
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
        stroke="rgba(15,23,42,0.4)"
        strokeWidth="1"
      />

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={compact ? "1.65" : "1.9"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={markerX} cy={markerY} r={compact ? "3.8" : "4.5"} fill={color} stroke="var(--surface)" strokeWidth="2.2" />
    </svg>
  );

  if (compact) {
    return (
      <div
        className={clsx(
          "grid min-h-0 grid-cols-[minmax(160px,0.48fr)_minmax(0,1fr)] bg-app-surface",
          separated && "border-t border-app-border",
        )}
      >
        <div className="flex min-w-0 flex-col justify-center gap-1.5 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="h-3.5 w-[3px] shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="panel-title text-[12px] leading-tight">{series.label}</span>
          </div>
          <span className="mono truncate text-[15px] font-bold tabular-nums" style={{ color: statusColor }}>
            {currentLabel}
          </span>
        </div>
        <div className="min-h-0 px-3 py-2">{chart}</div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className="flex shrink-0 items-center justify-between gap-3 border-b border-app-border px-5"
        style={{
          backgroundColor: `${color}0d`,
          height: expanded ? 48 : 40,
        }}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-[3px] rounded-full" style={{ backgroundColor: color }} />
          <span className={clsx("panel-title", expanded ? "text-[13px]" : "text-[12px]")}>
            {series.label}
          </span>
        </div>
        <span
          className={clsx(
            "mono shrink-0 font-bold tabular-nums",
            expanded ? "text-[16px]" : "text-[13px]",
          )}
          style={{ color: statusColor }}
        >
          {currentLabel}
        </span>
      </div>
      <div className="min-h-0 flex-1 px-4 pb-4 pt-3">
        {chart}
      </div>
    </div>
  );
}
