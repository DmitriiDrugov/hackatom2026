"use client";

import { useMemo, useState, useRef } from "react";
import clsx from "clsx";

import type { ChannelKey, ScenarioPayload } from "@/lib/domain";
import { colorForChannel, formatMw } from "@/lib/format";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

const channels: Array<{ key: ChannelKey; label: string }> = [
  { key: "electricity", label: "Electricity" },
  { key: "heat", label: "Heat" },
  { key: "hydrogen", label: "Hydrogen" },
  { key: "danubeCooling", label: "Danube cooling" },
];

// Bottom-up stacking order for the area chart (heaviest base channel first).
const stackOrder: ChannelKey[] = ["electricity", "heat", "hydrogen", "danubeCooling"];

const W = 800;
const H = 200;

// Smooth a polyline into cubic-bezier curves via Catmull-Rom tension.
function smoothPolyline(points: Array<[number, number]>, tension = 0.18, asM = true): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `${asM ? "M" : "L"} ${points[0][0]},${points[0][1]}`;

  let d = `${asM ? "M" : "L"} ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const c1x = p1[0] + (p2[0] - p0[0]) * tension;
    const c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension;
    const c2y = p2[1] - (p3[1] - p1[1]) * tension;

    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }

  return d;
}

export function AllocationTimeline({ data }: { data: ScenarioPayload }) {
  const selectedHour = useDashboardStore((state) => state.selectedHour);
  const openExplanation = useDashboardStore((state) => state.openExplanation);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { areaPaths, topLines, xs, maxTotal, stacks } = useMemo(() => {
    const N = data.timeline.length;
    const xs = data.timeline.map((_, i) => (i / (N - 1)) * W);

    // Cumulative stack per hour: stacks[h][k] = sum of channels[0..k-1]
    const stacks: number[][] = data.timeline.map((hour) => {
      let cum = 0;
      const row: number[] = [0];
      for (const c of stackOrder) {
        cum += hour.allocations[c];
        row.push(cum);
      }
      return row;
    });

    const maxTotal = Math.max(...stacks.map((row) => row[row.length - 1])) || 1;
    const y = (v: number) => H - (v / maxTotal) * H;

    const areaPaths: Array<{ key: ChannelKey; d: string; color: string }> = stackOrder.map(
      (channel, ci) => {
        const topPoints = xs.map((x, h) => [x, y(stacks[h][ci + 1])] as [number, number]);
        const bottomPoints = xs
          .map((x, h) => [x, y(stacks[h][ci])] as [number, number])
          .reverse();

        const topD = smoothPolyline(topPoints, 0.16, true);
        const bottomD = smoothPolyline(bottomPoints, 0.16, false);

        return {
          key: channel,
          d: `${topD} ${bottomD} Z`,
          color: colorForChannel(channel),
        };
      },
    );

    const topLines: Array<{ key: ChannelKey; d: string; color: string }> = stackOrder.map(
      (channel, ci) => {
        const topPoints = xs.map((x, h) => [x, y(stacks[h][ci + 1])] as [number, number]);
        return {
          key: channel,
          d: smoothPolyline(topPoints, 0.16, true),
          color: colorForChannel(channel),
        };
      },
    );

    return { areaPaths, topLines, xs, maxTotal, stacks };
  }, [data.timeline]);

  const yAxisLabels = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = (maxTotal / steps) * (steps - i);
      return { value, y: (i / steps) * H };
    });
  }, [maxTotal]);

  // Hover position
  const hoverHour = hoveredIdx !== null ? data.timeline[hoveredIdx] : null;
  const hoverX = hoveredIdx !== null ? xs[hoveredIdx] : 0;
  const hoverTotal = hoveredIdx !== null ? stacks[hoveredIdx][stacks[hoveredIdx].length - 1] : 0;

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const idx = Math.max(0, Math.min(xs.length - 1, Math.round(xRatio * (xs.length - 1))));
    setHoveredIdx(idx);
  };

  const handleClick = () => {
    if (hoveredIdx !== null) openExplanation(hoveredIdx);
  };

  return (
    <section className="dashboard-card flex min-h-0 flex-col">
      <PanelHeader title="48-hour allocation" value="MW / hour" accent="var(--primary)" />

      {/* Legend */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-app-border bg-app-sunken/40 px-5 py-2.5">
        {channels.map((channel) => (
          <div key={channel.key} className="flex items-center gap-1.5 text-[11px] font-semibold text-app-text-soft">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: colorForChannel(channel.key) }}
            />
            <span>{channel.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative min-h-0 flex-1 px-2 pb-7 pt-3">
        {/* Y-axis labels */}
        <div className="pointer-events-none absolute left-2 top-3 flex h-[calc(100%-2.75rem)] flex-col justify-between text-right">
          {yAxisLabels.map((tick) => (
            <span
              key={tick.value}
              className="mono pr-2 text-[9px] tabular-nums text-app-muted"
            >
              {Math.round(tick.value)}
            </span>
          ))}
        </div>

        <div className="ml-9 mr-1 h-full">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            {/* Horizontal gridlines */}
            {yAxisLabels.map((tick) => (
              <line
                key={tick.value}
                x1="0"
                x2={W}
                y1={tick.y}
                y2={tick.y}
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            ))}

            {/* Stacked areas */}
            {areaPaths.map((p) => (
              <path key={p.key} d={p.d} fill={p.color} opacity="0.55" />
            ))}

            {/* Crisp top strokes per channel */}
            {topLines.map((line) => (
              <path
                key={line.key}
                d={line.d}
                fill="none"
                stroke={line.color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Future region tint past hour 24 */}
            <rect x={xs[24]} y="0" width={W - xs[24]} height={H} fill="rgba(15,23,42,0.025)" />

            {/* "Now" line */}
            <line
              x1={xs[24]}
              x2={xs[24]}
              y1="0"
              y2={H}
              stroke="rgba(15,23,42,0.5)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />

            {/* Selected hour marker */}
            {selectedHour !== 24 && selectedHour >= 0 && selectedHour < xs.length ? (
              <line
                x1={xs[selectedHour]}
                x2={xs[selectedHour]}
                y1="0"
                y2={H}
                stroke="var(--primary)"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.6"
              />
            ) : null}

            {/* Hover crosshair */}
            {hoveredIdx !== null ? (
              <g>
                <line
                  x1={hoverX}
                  x2={hoverX}
                  y1="0"
                  y2={H}
                  stroke="var(--primary)"
                  strokeWidth="1.4"
                />
                <circle
                  cx={hoverX}
                  cy={H - (hoverTotal / maxTotal) * H}
                  r="4"
                  fill="white"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
              </g>
            ) : null}

            {/* Invisible hit area for hover/click */}
            <rect
              x="0"
              y="0"
              width={W}
              height={H}
              fill="transparent"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={handleClick}
              style={{ cursor: "crosshair" }}
            />
          </svg>
        </div>

        {/* X-axis */}
        <div className="mono pointer-events-none absolute inset-x-2 bottom-1 ml-9 flex justify-between text-[9px] font-medium uppercase tracking-wide text-app-muted">
          {["00", "06", "12", "18", "+24h", "06", "12", "18", "+48h"].map((label, index, labels) => (
            <span
              key={`${label}-${index}`}
              className={clsx(label.startsWith("+") && "font-semibold text-app-text-soft")}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Tooltip card */}
        {hoverHour ? (
          <div
            className="pointer-events-none absolute z-20 w-[200px] rounded-xl border border-app-border bg-white px-3 py-2.5 shadow-soft-pop"
            style={{
              top: 12,
              left: `min(max(${(hoverX / W) * 100}% + 1.75rem - 100px, 1rem), calc(100% - 13rem))`,
            }}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-bold text-app-text">{hoverHour.label}</span>
              <span className="mono text-[9px] font-semibold uppercase tracking-wider text-app-muted">
                {hoverHour.hourIndex < 24 ? "Today" : "Tomorrow"}
              </span>
            </div>
            {channels.map((channel) => (
              <div
                key={channel.key}
                className="flex items-baseline justify-between gap-3 py-0.5 text-[11px]"
              >
                <span className="flex items-center gap-1.5 text-app-text-soft">
                  <span
                    className="h-1.5 w-1.5 rounded-sm"
                    style={{ backgroundColor: colorForChannel(channel.key) }}
                  />
                  {channel.label}
                </span>
                <span className="mono font-semibold tabular-nums text-app-text">
                  {formatMw(hoverHour.allocations[channel.key])}
                </span>
              </div>
            ))}
            <div className="mt-1.5 flex items-baseline justify-between border-t border-app-border pt-1.5 text-[11px]">
              <span className="font-semibold text-app-muted-strong">Total</span>
              <span className="mono font-bold tabular-nums text-app-text">
                {formatMw(hoverTotal)}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
