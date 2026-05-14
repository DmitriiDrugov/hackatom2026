"use client";

import { useMemo, useRef, useState } from "react";
import clsx from "clsx";

import type { ForecastSeries, ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";

const chartColors = {
  electricityPrice: "#2563eb",
  danubeTemperature: "#f59e0b",
  heatDemand: "#0891b2",
};

// Hour 24 of the 48-hour forecast represents "now"; lower indices are history.
const NOW_HOUR = 24;
const TOTAL_HOURS = 48;
const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 92;

function useNowAnchor() {
  const [anchor] = useState(() => {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    return date;
  });
  return anchor;
}

function hourToDate(anchor: Date, hour: number) {
  return new Date(anchor.getTime() + (hour - NOW_HOUR) * 3_600_000);
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
}

function formatRelativeHours(offset: number) {
  if (offset === 0) return "now";
  const sign = offset > 0 ? "+" : "−";
  return `${sign}${Math.abs(offset)}h`;
}

function formatValue(unit: string, value: number) {
  if (unit === "°C") return `${value.toFixed(1)}°C`;
  if (unit === "MW") return `${value.toFixed(0)} MW`;
  if (unit === "€/MWh") return `${value > 0 ? "+" : ""}${value.toFixed(0)} €/MWh`;
  return `${value.toFixed(1)} ${unit}`;
}

function formatDelta(unit: string, value: number) {
  if (value === 0) return "no change";
  const abs = Math.abs(value);
  const arrow = value > 0 ? "▲" : "▼";
  if (unit === "°C") return `${arrow} ${abs.toFixed(1)}°C`;
  if (unit === "MW") return `${arrow} ${abs.toFixed(0)} MW`;
  if (unit === "€/MWh") return `${arrow} ${abs.toFixed(0)} €/MWh`;
  return `${arrow} ${abs.toFixed(1)}`;
}

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
  const anchor = useNowAnchor();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const points = series.points;
  const values = points.map((point) => point.value);
  const min = Math.min(...values, series.limit ?? Number.POSITIVE_INFINITY);
  const max = Math.max(...values, series.limit ?? Number.NEGATIVE_INFINITY);
  const pad = (max - min || 1) * 0.14;

  const yScale = (value: number) =>
    VIEW_HEIGHT -
    ((value - min + pad) / (max - min + pad * 2)) * VIEW_HEIGHT * 0.86 -
    VIEW_HEIGHT * 0.07;
  const xScale = (hour: number) => (hour / (TOTAL_HOURS - 1)) * VIEW_WIDTH;

  const polyPoints = points
    .map((point) => `${xScale(point.hour).toFixed(1)},${yScale(point.value).toFixed(1)}`)
    .join(" ");
  const areaPoints = `${polyPoints} ${VIEW_WIDTH},${VIEW_HEIGHT} 0,${VIEW_HEIGHT}`;
  const nowX = xScale(NOW_HOUR);
  const nowY = yScale(points[NOW_HOUR].value);

  // Notable change moments — local peaks, local troughs, and points where the
  // forecast crosses the safety limit. These are the "when does it change?"
  // anchors the operator wants to spot at a glance.
  const markers = useMemo(() => {
    const out: Array<{ hour: number; value: number; kind: "peak" | "trough" | "cross" }> = [];
    const significance = pad * 1.1;
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1].value;
      const curr = points[i].value;
      const next = points[i + 1].value;
      if (curr > prev && curr >= next && curr - Math.min(prev, next) > significance) {
        out.push({ hour: points[i].hour, value: curr, kind: "peak" });
      } else if (curr < prev && curr <= next && Math.max(prev, next) - curr > significance) {
        out.push({ hour: points[i].hour, value: curr, kind: "trough" });
      }
    }
    if (series.limit != null) {
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1].value;
        const curr = points[i].value;
        if ((prev < series.limit) !== (curr < series.limit)) {
          out.push({ hour: points[i].hour, value: curr, kind: "cross" });
        }
      }
    }
    return out;
  }, [points, series.limit, pad]);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    setHoverIndex(Math.round(clamped * (TOTAL_HOURS - 1)));
  };
  const handleLeave = () => setHoverIndex(null);

  const activeIdx = hoverIndex ?? NOW_HOUR;
  const activePoint = points[activeIdx];
  const activeDate = hourToDate(anchor, activePoint.hour);
  const activeOffset = activePoint.hour - NOW_HOUR;
  const activeX = xScale(activePoint.hour);
  const activeY = yScale(activePoint.value);
  const activeRatio = activePoint.hour / (TOTAL_HOURS - 1);
  const isHovering = hoverIndex !== null;
  const delta = activePoint.value - series.current;

  const slug = series.label.replace(/\s+/g, "-").toLowerCase();
  const statusColor = colorForStatus(series.status);
  const currentLabel = formatValue(series.unit, series.current);

  const ticks = compact
    ? [
        { hour: 0, label: "−24h" },
        { hour: NOW_HOUR, label: "now" },
        { hour: TOTAL_HOURS - 1, label: "+23h" },
      ]
    : [
        { hour: 0, label: formatClock(hourToDate(anchor, 0)) },
        { hour: 12, label: formatClock(hourToDate(anchor, 12)) },
        { hour: NOW_HOUR, label: "now" },
        { hour: 36, label: formatClock(hourToDate(anchor, 36)) },
        { hour: TOTAL_HOURS - 1, label: formatClock(hourToDate(anchor, TOTAL_HOURS - 1)) },
      ];

  const chart = (
    <div
      ref={chartRef}
      className="relative h-full w-full"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
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
            x2={VIEW_WIDTH}
            y1={VIEW_HEIGHT * t}
            y2={VIEW_HEIGHT * t}
            stroke="rgba(148, 163, 184, 0.22)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}

        <rect
          x={nowX}
          y="0"
          width={VIEW_WIDTH - nowX}
          height={VIEW_HEIGHT}
          fill={`url(#future-${slug})`}
        />

        <polygon points={areaPoints} fill={`url(#fill-${slug})`} />

        {series.limit != null ? (
          <line
            x1="0"
            x2={VIEW_WIDTH}
            y1={yScale(series.limit)}
            y2={yScale(series.limit)}
            stroke="var(--rose)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.8"
          />
        ) : null}

        <line
          x1={nowX}
          x2={nowX}
          y1="0"
          y2={VIEW_HEIGHT}
          stroke="rgba(15,23,42,0.4)"
          strokeWidth="1"
        />

        <polyline
          points={polyPoints}
          fill="none"
          stroke={color}
          strokeWidth={compact ? "1.65" : "1.9"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {markers.map((marker) => (
          <circle
            key={`${marker.kind}-${marker.hour}`}
            cx={xScale(marker.hour)}
            cy={yScale(marker.value)}
            r={compact ? "1.8" : "2.4"}
            fill={marker.kind === "cross" ? "var(--rose)" : color}
            stroke="var(--surface)"
            strokeWidth={compact ? "0.8" : "1.1"}
            opacity={marker.kind === "cross" ? 0.95 : 0.65}
          >
            <title>
              {marker.kind === "peak"
                ? "Peak"
                : marker.kind === "trough"
                  ? "Trough"
                  : "Crosses limit"}{" "}
              at {formatClock(hourToDate(anchor, marker.hour))} ·{" "}
              {formatValue(series.unit, marker.value)}
            </title>
          </circle>
        ))}

        <circle
          cx={nowX}
          cy={nowY}
          r={compact ? "3.8" : "4.5"}
          fill={color}
          stroke="var(--surface)"
          strokeWidth="2.2"
        />

        {isHovering ? (
          <>
            <line
              x1={activeX}
              x2={activeX}
              y1="0"
              y2={VIEW_HEIGHT}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.75"
            />
            <circle
              cx={activeX}
              cy={activeY}
              r={compact ? "3.2" : "4"}
              fill="var(--surface)"
              stroke={color}
              strokeWidth="2"
            />
          </>
        ) : null}
      </svg>

      {isHovering ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-app-border bg-app-surface px-2 py-1 shadow-soft-pop"
          style={{
            top: 2,
            left: `${Math.min(86, Math.max(14, activeRatio * 100))}%`,
          }}
        >
          <div
            className="mono text-[10px] font-bold leading-tight tabular-nums"
            style={{ color: statusColor }}
          >
            {formatValue(series.unit, activePoint.value)}
          </div>
          <div className="mono text-[9px] leading-tight text-app-muted">
            {formatRelativeHours(activeOffset)} · {formatClock(activeDate)}
          </div>
          {activeOffset !== 0 ? (
            <div
              className="mono text-[9px] leading-tight font-semibold"
              style={{ color: delta > 0 ? "var(--amber)" : delta < 0 ? "var(--primary-strong)" : "var(--muted)" }}
            >
              {formatDelta(series.unit, delta)} vs now
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const axisLabels = (
    <div className="relative h-3 select-none">
      {ticks.map((tick) => {
        const ratio = tick.hour / (TOTAL_HOURS - 1);
        const isLeftEdge = ratio < 0.05;
        const isRightEdge = ratio > 0.95;
        return (
          <span
            key={tick.hour}
            className={clsx(
              "mono absolute top-0 whitespace-nowrap text-[9px] leading-none",
              tick.hour === NOW_HOUR ? "font-semibold text-app-text" : "text-app-muted",
            )}
            style={{
              left: isRightEdge ? undefined : isLeftEdge ? 0 : `${ratio * 100}%`,
              right: isRightEdge ? 0 : undefined,
              transform: isLeftEdge || isRightEdge ? undefined : "translateX(-50%)",
            }}
          >
            {tick.label}
          </span>
        );
      })}
    </div>
  );

  if (compact) {
    return (
      <div
        className={clsx(
          "grid min-h-0 grid-cols-[minmax(160px,0.48fr)_minmax(0,1fr)] bg-app-surface",
          separated && "border-t border-app-border",
        )}
      >
        <div className="flex min-w-0 flex-col justify-center gap-1 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="h-3.5 w-[3px] shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="panel-title text-[12px] leading-tight">{series.label}</span>
          </div>
          <span
            className="mono truncate text-[15px] font-bold tabular-nums"
            style={{ color: statusColor }}
          >
            {currentLabel}
          </span>
          <span className="mono text-[9px] uppercase tracking-wide text-app-muted">
            {formatClock(anchor)} · {formatDayLabel(anchor)}
          </span>
        </div>
        <div className="flex min-h-0 flex-col px-3 pb-1.5 pt-2">
          <div className="min-h-0 flex-1">{chart}</div>
          {axisLabels}
        </div>
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
          <span
            aria-hidden
            className="h-3.5 w-[3px] rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className={clsx("panel-title", expanded ? "text-[13px]" : "text-[12px]")}>
            {series.label}
          </span>
        </div>
        <div className="flex shrink-0 items-baseline gap-2">
          <span
            className={clsx(
              "mono font-bold tabular-nums",
              expanded ? "text-[16px]" : "text-[13px]",
            )}
            style={{ color: statusColor }}
          >
            {currentLabel}
          </span>
          <span className="mono text-[10px] text-app-muted">
            {formatClock(anchor)}
          </span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-3">
        <div className="min-h-0 flex-1">{chart}</div>
        {axisLabels}
        <div className="mt-1 flex items-center justify-between text-[10px] text-app-muted">
          <span>{formatDayLabel(hourToDate(anchor, 0))}</span>
          <span className="mono uppercase tracking-wide">48-hour rolling forecast</span>
          <span>{formatDayLabel(hourToDate(anchor, TOTAL_HOURS - 1))}</span>
        </div>
      </div>
    </div>
  );
}
