"use client";

import clsx from "clsx";

import type { CityAllocation, ScenarioPayload } from "@/lib/domain";
import { formatMw, formatTemp } from "@/lib/format";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

const colorMap = {
  cyan: "#38bdf8",
  emerald: "#34d399",
  purple: "#c084fc",
};

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
      <text
        y={city.kind === "source" ? 24 : -13}
        textAnchor="middle"
        fill="#94a3b8"
        fontFamily="Inter"
        fontSize="9"
        fontWeight="600"
      >
        {city.name}
      </text>
      <text
        y={city.kind === "source" ? 33 : -4}
        textAnchor="middle"
        fill="#475569"
        fontFamily="JetBrains Mono"
        fontSize="8"
      >
        {city.kind === "source" ? "1980 MW" : `${city.heatMw} MW`}
      </text>
    </g>
  );
}

export function MapPanel({ data }: { data: ScenarioPayload }) {
  const selectedCityId = useDashboardStore((state) => state.selectedCityId);
  const setSelectedCityId = useDashboardStore((state) => state.setSelectedCityId);
  const selectedCity = data.cities.find((city) => city.id === selectedCityId) ?? data.cities[0];
  const paks = data.cities.find((city) => city.id === "paks") ?? data.cities[0];
  const riverStatus =
    data.danube.status === "crit" ? "#fb7185" : data.danube.status === "warn" ? "#0e7490" : "#0e4f6b";

  return (
    <section className="flex min-h-0 flex-col overflow-hidden border-r border-app-border bg-app-surface">
      <PanelHeader title="Geographic allocation" value="Hungary · CET" />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg viewBox="0 0 600 360" className="h-full w-full" aria-label="Hungary heat allocation map">
          <polygon
            points="88,108 110,88 150,76 195,72 238,80 285,72 322,78 355,85 385,98 410,88 440,95 468,110 482,130 478,152 465,170 472,195 458,215 438,232 415,245 388,248 358,250 320,255 288,248 262,258 235,262 205,255 175,258 150,252 128,240 110,225 95,208 82,190 78,168 82,148 88,128"
            fill="#131f35"
            stroke="#1e3a5f"
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
        </svg>

        <div className="absolute right-3 top-3 w-44 rounded-md border border-app-border bg-app-surface p-3">
          <div className="mb-2 text-[12px] font-semibold text-app-text">{selectedCity.name}</div>
          <div className="space-y-1">
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
              data.danube.status === "crit" ? "bg-app-rose" : "bg-gradient-to-r from-sky-500 to-app-amber",
            )}
            style={{ width: `${data.danube.pctOfLimit}%` }}
          />
        </div>
        <span
          className="mono w-[54px] shrink-0 text-right text-[11px]"
          style={{ color: data.danube.status === "crit" ? "#fb7185" : data.danube.status === "warn" ? "#fbbf24" : "#38bdf8" }}
        >
          {formatTemp(data.danube.currentTempC)}
        </span>
        <span className="shrink-0 text-[10px] text-app-muted">/ {formatTemp(data.danube.limitTempC)} limit</span>
      </div>
    </section>
  );
}

function CityRow({ label, value, status }: { label: string; value: string; status?: "ok" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-app-muted">{label}</span>
      <span className={clsx("mono text-[11px]", status === "ok" ? "text-app-emerald" : "text-app-text")}>{value}</span>
    </div>
  );
}
