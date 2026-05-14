"use client";

import clsx from "clsx";
import { useMemo } from "react";

import type { CityAllocation } from "@/lib/domain";
import { formatMw } from "@/lib/format";

const MAP_WIDTH = 800;
const MAP_HEIGHT = 460;
const LAT_NORTH = 48.6;
const LAT_RANGE = 2.9;
const LON_WEST = 16.1;
const LON_RANGE = 6.8;

// Project geographic coordinates into the SVG viewBox.
function projectX(lon: number) {
  return ((lon - LON_WEST) / LON_RANGE) * MAP_WIDTH;
}
function projectY(lat: number) {
  return ((LAT_NORTH - lat) / LAT_RANGE) * MAP_HEIGHT;
}

// Simplified Hungary national outline (clockwise from NW).
const HUNGARY_OUTLINE =
  "M 47 143 L 129 111 L 224 95 L 324 119 L 400 32 L 541 8 L 682 32 L 788 95 L 753 190 L 653 317 L 576 388 L 400 404 L 282 447 L 182 452 L 35 349 L 0 277 L 41 190 Z";

// Approximate Danube course through Hungary.
const DANUBE_PATH =
  "M 251 14 Q 305 70 311 128 Q 320 150 346 175 Q 350 210 334 254 Q 330 290 323 321 Q 312 370 300 413";

// Faint internal county-like reference lines for the industrial-map texture.
const REFERENCE_LINES = [
  "M 0 277 L 800 250",
  "M 50 200 L 750 220",
  "M 100 350 L 700 360",
];

const colorMap: Record<CityAllocation["color"], string> = {
  cyan: "#2563eb",
  emerald: "#059669",
  purple: "#7c3aed",
};

// Per-city label placement (offset from the projected dot) and value tint.
const labelOffsets: Record<string, { dx: number; dy: number; anchor: "start" | "end" | "middle" }> = {
  paks: { dx: 16, dy: 6, anchor: "start" },
  budapest: { dx: 18, dy: -6, anchor: "start" },
  dunaujvaros: { dx: 18, dy: 4, anchor: "start" },
  szekszard: { dx: 18, dy: 4, anchor: "start" },
};

export function HungaryMap({
  cities,
  selectedCityId,
  danubeStatus,
  onSelectCity,
}: {
  cities: CityAllocation[];
  selectedCityId: string;
  danubeStatus: "ok" | "warn" | "crit";
  onSelectCity: (id: string) => void;
}) {
  const paks = cities.find((city) => city.kind === "source") ?? cities[0];
  const sinks = useMemo(() => cities.filter((city) => city.kind === "sink"), [cities]);

  const danubeColor =
    danubeStatus === "crit" ? "#ef4444" : danubeStatus === "warn" ? "#0e7490" : "#0891b2";

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="Hungary heat allocation map"
    >
      <defs>
        {/* Dotted grid for the industrial-tactical texture. */}
        <pattern id="grid-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.7" fill="#cbd5e1" opacity="0.55" />
        </pattern>
        {/* Heavier crosshair grid for the inner Hungary fill. */}
        <pattern id="grid-cross" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 16 L20 24 M16 20 L24 20" stroke="#94a3b8" strokeWidth="0.6" opacity="0.32" />
        </pattern>
        {/* Soft fill for the Hungary landmass. */}
        <linearGradient id="land-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbe6f1" />
          <stop offset="100%" stopColor="#cdd9e6" />
        </linearGradient>
        <clipPath id="hungary-clip">
          <path d={HUNGARY_OUTLINE} />
        </clipPath>
      </defs>

      {/* Background grid */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid-dots)" />

      {/* Tick coordinates around the edges — gives a tactical-map feel */}
      <g fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace" opacity="0.5">
        <text x="6" y="14">N 48.6°</text>
        <text x="6" y={MAP_HEIGHT - 6}>N 45.7°</text>
        <text x={MAP_WIDTH - 6} y={MAP_HEIGHT - 6} textAnchor="end">E 22.9°</text>
        <text x="6" y={MAP_HEIGHT / 2} opacity="0.4">+</text>
        <text x={MAP_WIDTH - 14} y={MAP_HEIGHT / 2} opacity="0.4">+</text>
      </g>

      {/* Hungary landmass: filled and overlaid with crosshair grid */}
      <g>
        <path d={HUNGARY_OUTLINE} fill="url(#land-fill)" stroke="none" />
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid-cross)" clipPath="url(#hungary-clip)" />
        <path
          d={HUNGARY_OUTLINE}
          fill="none"
          stroke="#64748b"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Inner glow stroke */}
        <path
          d={HUNGARY_OUTLINE}
          fill="none"
          stroke="#0891b2"
          strokeWidth="0.6"
          strokeLinejoin="round"
          opacity="0.35"
        />
      </g>

      {/* Reference latitude lines inside Hungary */}
      <g clipPath="url(#hungary-clip)" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.45">
        {REFERENCE_LINES.map((d, index) => (
          <path key={index} d={d} fill="none" />
        ))}
      </g>

      {/* Danube */}
      <g>
        <path
          d={DANUBE_PATH}
          fill="none"
          stroke={danubeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.18"
        />
        <path
          d={DANUBE_PATH}
          fill="none"
          stroke={danubeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d={DANUBE_PATH}
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.6"
          strokeDasharray="4 6"
          opacity="0.6"
        />
      </g>

      {/* Flow corridors from Paks → each served city */}
      <g>
        {sinks.map((city) => {
          const color = colorMap[city.color];
          const w = Math.max(1.4, Math.min(3.2, city.heatMw / 100));
          return (
            <g key={`flow-${city.id}`}>
              <line
                x1={projectX(paks.longitude)}
                y1={projectY(paks.latitude)}
                x2={projectX(city.longitude)}
                y2={projectY(city.latitude)}
                stroke={color}
                strokeWidth={w + 4}
                strokeLinecap="round"
                opacity="0.08"
              />
              <line
                x1={projectX(paks.longitude)}
                y1={projectY(paks.latitude)}
                x2={projectX(city.longitude)}
                y2={projectY(city.latitude)}
                stroke={color}
                strokeWidth={w}
                strokeLinecap="round"
                strokeDasharray="6 5"
                opacity="0.75"
                className="animate-flow"
              />
            </g>
          );
        })}
      </g>

      {/* City reticles */}
      <g>
        {cities.map((city) => {
          const cx = projectX(city.longitude);
          const cy = projectY(city.latitude);
          const color = colorMap[city.color];
          const isSelected = city.id === selectedCityId;
          const isSource = city.kind === "source";

          const offset = labelOffsets[city.id] ?? { dx: 16, dy: 0, anchor: "start" as const };
          const labelX = cx + offset.dx;
          const labelY = cy + offset.dy;

          return (
            <g
              key={city.id}
              className="cursor-pointer"
              onClick={() => onSelectCity(city.id)}
            >
              {/* Crosshairs for source / selected */}
              {(isSource || isSelected) && (
                <g stroke={color} strokeWidth={isSource ? 1.2 : 0.9} opacity={isSource ? 0.85 : 0.7}>
                  <line x1={cx - (isSource ? 22 : 16)} y1={cy} x2={cx - (isSource ? 12 : 9)} y2={cy} />
                  <line x1={cx + (isSource ? 12 : 9)} y1={cy} x2={cx + (isSource ? 22 : 16)} y2={cy} />
                  <line x1={cx} y1={cy - (isSource ? 22 : 16)} x2={cx} y2={cy - (isSource ? 12 : 9)} />
                  <line x1={cx} y1={cy + (isSource ? 12 : 9)} x2={cx} y2={cy + (isSource ? 22 : 16)} />
                </g>
              )}

              {/* Outer reticle ring */}
              <circle
                cx={cx}
                cy={cy}
                r={isSource ? 16 : isSelected ? 13 : 10}
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeDasharray={isSelected ? "3 3" : isSource ? "" : "2 4"}
                opacity={isSelected ? 0.9 : 0.55}
              />

              {/* Mid ring */}
              <circle
                cx={cx}
                cy={cy}
                r={isSource ? 9 : 6.5}
                fill={color}
                fillOpacity="0.18"
                stroke={color}
                strokeWidth="1.2"
              />

              {/* Click area for sources/sinks */}
              <circle cx={cx} cy={cy} r={18} fill="transparent">
                <title>{`${city.name} · ${formatMw(city.heatMw)}`}</title>
              </circle>

              {/* Core dot */}
              <circle
                cx={cx}
                cy={cy}
                r={isSource ? 3.6 : 2.8}
                fill={color}
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Label */}
              <g>
                {/* Tick from city to label */}
                <line
                  x1={cx + (isSource ? 9 : 6.5)}
                  y1={cy}
                  x2={labelX - 2}
                  y2={labelY - 4}
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.55"
                />
                <rect
                  x={labelX - 4}
                  y={labelY - 14}
                  rx="3"
                  ry="3"
                  width={Math.max(70, city.name.length * 6.6 + 16)}
                  height="28"
                  fill="#ffffff"
                  stroke={isSelected ? color : "#cbd5e1"}
                  strokeWidth={isSelected ? 1.4 : 0.8}
                  className={clsx(isSelected && "drop-shadow-sm")}
                />
                <text
                  x={labelX + 4}
                  y={labelY - 2}
                  fill="#0f172a"
                  fontSize="10.5"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                  textAnchor={offset.anchor}
                >
                  {isSource ? "Paks NPP" : city.name}
                </text>
                <text
                  x={labelX + 4}
                  y={labelY + 9}
                  fill={color}
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="500"
                  textAnchor={offset.anchor}
                >
                  {formatMw(city.heatMw)}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
