"use client";

import { useMemo } from "react";

import type { CityAllocation } from "@/lib/domain";

const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;
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

// Detailed Hungary national outline (~28 vertices, clockwise from NW).
const HUNGARY_BORDER: Array<[number, number]> = [
  [16.59, 47.68], // Sopron NW
  [16.95, 47.92], // N of Sopron
  [17.27, 47.86], // Mosonmagyaróvár
  [17.78, 47.96], // Rajka
  [18.13, 47.74], // Komárom
  [18.55, 47.83], // toward Esztergom
  [18.74, 47.79], // Esztergom
  [18.97, 47.81], // Szob
  [19.45, 48.0], // Balassagyarmat
  [19.81, 48.1], // Salgótarján
  [20.38, 48.18], // N of Eger
  [20.95, 48.35], // Slovak border bulge
  [21.41, 48.43], // Tokaj area
  [21.85, 48.5], // NE bulge
  [22.17, 48.42], // Záhony
  [22.55, 48.3], // toward Vásárosnamény
  [22.85, 48.05], // Tiszabecs E corner
  [22.55, 47.78], // E with Romania
  [22.35, 47.4], // toward Létavértes
  [22.1, 47.05], // Berettyóújfalu E
  [21.65, 46.78], // toward Gyula
  [21.3, 46.55], // E of Békéscsaba
  [21.02, 46.29], // Battonya SE
  [20.5, 46.18], // S of Szeged
  [19.9, 46.2], // Mórahalom
  [19.45, 46.13], // Bácsalmás
  [18.93, 45.96], // Hercegszántó S corner
  [18.68, 45.99], // Mohács
  [18.2, 45.79], // Drávaszabolcs
  [17.62, 45.85], // S
  [17.05, 45.97], // toward Barcs
  [16.78, 46.2], // SW indent
  [16.55, 46.43], // Letenye SW corner
  [16.32, 46.65], // W with Slovenia
  [16.1, 46.92], // Szentgotthárd
  [16.27, 47.18], // back N
  [16.45, 47.39], // Kőszeg
  [16.59, 47.68], // close
];

// Approximate Danube course through Hungary (N → S, slight bend at Budapest).
const DANUBE_POINTS: Array<[number, number]> = [
  [17.18, 48.0], // enter NW (Rajka)
  [17.65, 47.85], // Győr area
  [18.13, 47.74], // Komárom
  [18.55, 47.81], // toward Esztergom
  [18.74, 47.79], // Esztergom (bend)
  [18.95, 47.71], // Visegrád
  [19.04, 47.5], // Budapest
  [18.94, 47.2], // S of Budapest
  [18.94, 46.96], // Dunaújváros
  [18.85, 46.57],
  [18.95, 46.18], // Baja
  [18.68, 45.99], // Mohács
];

// Tisza river — enters NE, flows SW toward Szeged.
const TISZA_POINTS: Array<[number, number]> = [
  [22.85, 48.1],
  [22.0, 48.05],
  [21.41, 48.13],
  [20.95, 47.92],
  [20.77, 47.62],
  [20.4, 47.4],
  [20.2, 47.18],
  [20.14, 46.7],
  [20.15, 46.25],
];

// Lake Balaton — center + axes (rotated to match real orientation).
const BALATON_CENTER = { lon: 17.85, lat: 46.85 };
const BALATON_LON_AXIS = 0.42;
const BALATON_LAT_AXIS = 0.06;
const BALATON_ROTATION = -25;

const colorMap: Record<CityAllocation["color"], string> = {
  cyan: "#2563eb",
  emerald: "#059669",
  purple: "#7c3aed",
};

function toPath(points: Array<[number, number]>, closed = false): string {
  if (points.length === 0) return "";
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${projectX(p[0]).toFixed(1)},${projectY(p[1]).toFixed(1)}`,
    )
    .join(" ");
  return closed ? `${d} Z` : d;
}

// Smooth a polyline into cubic-bezier curves via Catmull-Rom tension.
function smoothPath(points: Array<[number, number]>, tension = 0.2): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;

  const projected = points.map(([lon, lat]) => [projectX(lon), projectY(lat)] as const);
  let d = `M ${projected[0][0].toFixed(1)},${projected[0][1].toFixed(1)}`;

  for (let i = 0; i < projected.length - 1; i++) {
    const p0 = projected[Math.max(0, i - 1)];
    const p1 = projected[i];
    const p2 = projected[i + 1];
    const p3 = projected[Math.min(projected.length - 1, i + 2)];

    const c1x = p1[0] + (p2[0] - p0[0]) * tension;
    const c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension;
    const c2y = p2[1] - (p3[1] - p1[1]) * tension;

    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }

  return d;
}

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
  const source = cities.find((city) => city.kind === "source") ?? cities[0];
  const sinks = useMemo(() => cities.filter((city) => city.kind === "sink"), [cities]);

  const outlinePath = useMemo(() => smoothPath(HUNGARY_BORDER, 0.18), []);
  const danubePath = useMemo(() => smoothPath(DANUBE_POINTS, 0.22), []);
  const tiszaPath = useMemo(() => smoothPath(TISZA_POINTS, 0.22), []);

  const balatonCx = projectX(BALATON_CENTER.lon);
  const balatonCy = projectY(BALATON_CENTER.lat);
  const balatonRx = (BALATON_LON_AXIS / LON_RANGE) * MAP_WIDTH;
  const balatonRy = (BALATON_LAT_AXIS / LAT_RANGE) * MAP_HEIGHT;

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
        <pattern
          id="grid-dots"
          x="0"
          y="0"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="11" cy="11" r="0.6" fill="#cbd5e1" opacity="0.65" />
        </pattern>
        <pattern
          id="grid-cross"
          x="0"
          y="0"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M18 14 L18 22 M14 18 L22 18"
            stroke="#94a3b8"
            strokeWidth="0.55"
            opacity="0.35"
          />
        </pattern>
        <linearGradient id="land-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dde7f1" />
          <stop offset="100%" stopColor="#c8d5e3" />
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.06)" />
        </radialGradient>
        <clipPath id="hungary-clip">
          <path d={outlinePath} />
        </clipPath>
      </defs>

      {/* Background grid */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid-dots)" />

      {/* Coordinate ticks for a tactical feel */}
      <g fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono, monospace" opacity="0.55">
        <text x="6" y="14">
          48.6°N
        </text>
        <text x="6" y={MAP_HEIGHT - 8}>
          45.7°N
        </text>
        <text x={MAP_WIDTH - 6} y={14} textAnchor="end">
          22.9°E
        </text>
        <text x={MAP_WIDTH - 6} y={MAP_HEIGHT - 8} textAnchor="end">
          16.1°E
        </text>
      </g>

      {/* Hungary landmass: gradient fill, crosshatch overlay, dark outline */}
      <g>
        <path d={outlinePath} fill="url(#land-fill)" />
        <rect
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          fill="url(#grid-cross)"
          clipPath="url(#hungary-clip)"
        />
        <path
          d={outlinePath}
          fill="none"
          stroke="#475569"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d={outlinePath}
          fill="none"
          stroke="#0e7490"
          strokeWidth="0.5"
          strokeLinejoin="round"
          opacity="0.4"
        />
      </g>

      {/* Lake Balaton */}
      <g transform={`rotate(${BALATON_ROTATION} ${balatonCx} ${balatonCy})`}>
        <ellipse
          cx={balatonCx}
          cy={balatonCy}
          rx={balatonRx}
          ry={balatonRy}
          fill={danubeColor}
          fillOpacity="0.18"
          stroke={danubeColor}
          strokeWidth="1"
        />
        <ellipse
          cx={balatonCx}
          cy={balatonCy}
          rx={balatonRx * 0.6}
          ry={balatonRy * 0.5}
          fill={danubeColor}
          fillOpacity="0.12"
        />
      </g>

      {/* Tisza */}
      <g>
        <path
          d={tiszaPath}
          fill="none"
          stroke={danubeColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.18"
        />
        <path
          d={tiszaPath}
          fill="none"
          stroke={danubeColor}
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Danube — the strategic axis */}
      <g>
        <path
          d={danubePath}
          fill="none"
          stroke={danubeColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.16"
        />
        <path
          d={danubePath}
          fill="none"
          stroke={danubeColor}
          strokeWidth="1.9"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d={danubePath}
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.7"
          strokeDasharray="4 6"
          opacity="0.6"
        />
      </g>

      {/* Soft edge vignette */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#vignette)" pointerEvents="none" />

      {/* Flow corridors between nodes (no source emphasis — equal styling for both ends) */}
      <g>
        {sinks.map((city) => {
          const color = colorMap[city.color];
          const w = Math.max(1.4, Math.min(3.0, city.heatMw / 110));
          const x1 = projectX(source.longitude);
          const y1 = projectY(source.latitude);
          const x2 = projectX(city.longitude);
          const y2 = projectY(city.latitude);
          return (
            <g key={`flow-${city.id}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={w + 4}
                strokeLinecap="round"
                opacity="0.09"
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={w}
                strokeLinecap="round"
                strokeDasharray="6 5"
                opacity="0.8"
                className="animate-flow"
              />
            </g>
          );
        })}
      </g>

      {/* Node markers — uniform across all cities */}
      <g>
        {cities.map((city) => {
          const cx = projectX(city.longitude);
          const cy = projectY(city.latitude);
          const color = colorMap[city.color];
          const isSelected = city.id === selectedCityId;

          return (
            <g key={city.id} className="cursor-pointer" onClick={() => onSelectCity(city.id)}>
              {/* Hover ring on selected */}
              {isSelected ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r="18"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.9"
                />
              ) : null}

              {/* Crosshair tick marks on selected */}
              {isSelected ? (
                <g stroke={color} strokeWidth="1" opacity="0.85">
                  <line x1={cx - 24} y1={cy} x2={cx - 14} y2={cy} />
                  <line x1={cx + 14} y1={cy} x2={cx + 24} y2={cy} />
                  <line x1={cx} y1={cy - 24} x2={cx} y2={cy - 14} />
                  <line x1={cx} y1={cy + 14} x2={cx} y2={cy + 24} />
                </g>
              ) : null}

              {/* Outer reticle ring */}
              <circle
                cx={cx}
                cy={cy}
                r="11"
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.55"
              />

              {/* Mid ring (filled glow) */}
              <circle
                cx={cx}
                cy={cy}
                r="6.5"
                fill={color}
                fillOpacity="0.2"
                stroke={color}
                strokeWidth="1.4"
              />

              {/* Click hit area */}
              <circle cx={cx} cy={cy} r="22" fill="transparent">
                <title>{city.kind === "source" ? "Energy Hub" : city.name}</title>
              </circle>

              {/* Core dot */}
              {city.kind === "source" ? (
                // Distinguish source by a tiny inner square instead of a bigger dot
                <rect
                  x={cx - 2.2}
                  y={cy - 2.2}
                  width="4.4"
                  height="4.4"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r="2.8"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="1.4"
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
