"use client";

import clsx from "clsx";

import type { CityAllocation, ScenarioPayload } from "@/lib/domain";
import { formatMw, formatTemp } from "@/lib/format";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

const colorMap = {
  cyan: "#4cc9f0",
  emerald: "#3ddc97",
  purple: "#b78cff",
};

const cityLabelLayout: Record<
  string,
  { x: number; y: number; width: number; anchorX: number; anchorY: number }
> = {
  budapest: { x: 210, y: 101, width: 70, anchorX: 250, anchorY: 118 },
  dunaujvaros: { x: 201, y: 150, width: 94, anchorX: 295, anchorY: 162 },
  paks: { x: 342, y: 249, width: 72, anchorX: 310, anchorY: 195 },
  szekszard: { x: 430, y: 242, width: 76, anchorX: 355, anchorY: 225 },
};

// Renders an interactive city marker without overlapping text labels.
function CityMarker({
  city,
  active,
  onSelect,
}: {
  city: CityAllocation;
  active: boolean;
  onSelect: () => void;
}) {
  const color = colorMap[city.color];

  return (
    <g
      transform={`translate(${city.x},${city.y})`}
      onClick={onSelect}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={city.name}
    >
      <circle r={city.kind === "source" ? 14 : 10} fill={`${color}14`} stroke={`${color}88`} strokeWidth="1.5" />
      <circle r={city.kind === "source" ? 5 : 4} fill={`${color}66`} />
      <circle r="2" fill={color} />
      {active ? <circle r={city.kind === "source" ? 18 : 14} fill="none" stroke={color} strokeWidth="1" /> : null}
    </g>
  );
}

// Renders a readable map label separated from the marker by a leader line.
function CityLabel({ city, active }: { city: CityAllocation; active: boolean }) {
  const layout = cityLabelLayout[city.id];

  if (!layout) {
    return null;
  }

  const color = colorMap[city.color];
  const labelX = layout.x - layout.width / 2;

  return (
    <g pointerEvents="none">
      <line
        x1={layout.anchorX}
        y1={layout.anchorY}
        x2={layout.x}
        y2={layout.y + 8}
        stroke={color}
        strokeWidth="1"
        opacity={active ? "0.8" : "0.45"}
      />
      <rect
        x={labelX}
        y={layout.y}
        width={layout.width}
        height="18"
        rx="4"
        fill={active ? "#182231" : "#101722"}
        stroke={active ? color : "#2a3648"}
        strokeWidth="1"
        opacity="0.96"
      />
      <text
        x={layout.x}
        y={layout.y + 12}
        textAnchor="middle"
        fill={active ? "#f2f6fb" : "#c8d3e2"}
        fontFamily="Inter"
        fontSize="9.5"
        fontWeight={active ? "700" : "600"}
      >
        {city.name}
      </text>
    </g>
  );
}

// Renders the geographic allocation panel with city flows and Danube safety state.
export function MapPanel({ data }: { data: ScenarioPayload }) {
  const selectedCityId = useDashboardStore((state) => state.selectedCityId);
  const setSelectedCityId = useDashboardStore((state) => state.setSelectedCityId);
  const selectedCity = data.cities.find((city) => city.id === selectedCityId) ?? data.cities[0];
  const paks = data.cities.find((city) => city.id === "paks") ?? data.cities[0];
  const riverStatus =
    data.danube.status === "crit" ? "#ff6b7a" : data.danube.status === "warn" ? "#2f8faf" : "#22647f";

  return (
    <section className="flex min-h-0 flex-col overflow-hidden border-r border-app-border bg-app-surface">
      <PanelHeader title="Geographic allocation" value="Hungary · CET" />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg viewBox="48 62 482 238" className="h-full w-full" aria-label="Hungary heat allocation map">
          <polygon
            points="88,108 110,88 150,76 195,72 238,80 285,72 322,78 355,85 385,98 410,88 440,95 468,110 482,130 478,152 465,170 472,195 458,215 438,232 415,245 388,248 358,250 320,255 288,248 262,258 235,262 205,255 175,258 150,252 128,240 110,225 95,208 82,190 78,168 82,148 88,128"
            fill="#0f1824"
            stroke="#30445f"
            strokeWidth="1.5"
          />
          <path
            d="M285,72 Q298,110 310,148 Q318,185 322,215 Q325,235 320,255"
            fill="none"
            stroke={riverStatus}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {data.cities
            .filter((city) => city.kind === "sink")
            .map((city) => {
              const width = Math.max(2.4, Math.min(6, city.heatMw / 70));
              return (
                <line
                  key={city.id}
                  x1={paks.x}
                  y1={paks.y}
                  x2={city.x}
                  y2={city.y}
                  stroke={colorMap[city.color]}
                  strokeWidth={width}
                  opacity="0.78"
                  strokeDasharray="7 5"
                  className="animate-flow"
                />
              );
            })}

          {data.cities.map((city) => (
            <CityMarker
              key={city.id}
              city={city}
              active={city.id === selectedCity.id}
              onSelect={() => setSelectedCityId(city.id)}
            />
          ))}

          {data.cities.map((city) => (
            <CityLabel key={`${city.id}-label`} city={city} active={city.id === selectedCity.id} />
          ))}
        </svg>

        <div className="absolute right-3 top-3 w-[188px] rounded-md border border-app-border bg-app-elevated/95 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.26)]">
          <div className="mb-2 truncate text-[13px] font-semibold text-app-text">{selectedCity.name}</div>
          <div className="space-y-1.5">
            <CityRow label="Heat delivered" value={formatMw(selectedCity.heatMw)} />
            <CityRow label="Distance" value={selectedCity.distanceKm == null ? "-" : `${selectedCity.distanceKm} km`} />
            <CityRow
              label="Pipeline loss"
              value={selectedCity.pipelineLossPct == null ? "-" : `${selectedCity.pipelineLossPct.toFixed(1)}%`}
            />
            <CityRow
              label="Demand coverage"
              value={selectedCity.demandCoveragePct == null ? "-" : `${selectedCity.demandCoveragePct}%`}
              status={selectedCity.demandCoveragePct && selectedCity.demandCoveragePct > 90 ? "ok" : undefined}
            />
          </div>
        </div>
      </div>

      <div className="flex h-9 items-center gap-2 border-t border-app-border px-3">
        <span className="w-14 shrink-0 text-[10px] text-app-muted">Danube temp</span>
        <div className="h-[5px] min-w-0 flex-1 overflow-hidden rounded-full bg-app-elevated">
          <div
            className={clsx(
              "h-full rounded-full",
              data.danube.status === "crit" ? "bg-app-rose" : "bg-gradient-to-r from-app-cyan to-app-amber",
            )}
            style={{ width: `${data.danube.pctOfLimit}%` }}
          />
        </div>
        <span
          className="mono w-[54px] shrink-0 text-right text-[11px]"
          style={{ color: data.danube.status === "crit" ? "#ff6b7a" : data.danube.status === "warn" ? "#f5c451" : "#4cc9f0" }}
        >
          {formatTemp(data.danube.currentTempC)}
        </span>
        <span className="shrink-0 text-[10px] text-app-muted">/ {formatTemp(data.danube.limitTempC)} limit</span>
      </div>
    </section>
  );
}

// Renders one compact city detail row inside the selected-city card.
function CityRow({ label, value, status }: { label: string; value: string; status?: "ok" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-app-muted">{label}</span>
      <span className={clsx("mono text-[11px]", status === "ok" ? "text-app-emerald" : "text-app-text")}>{value}</span>
    </div>
  );
}
