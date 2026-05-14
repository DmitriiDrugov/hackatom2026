"use client";

import clsx from "clsx";
import { useMemo } from "react";

import type { ScenarioPayload } from "@/lib/domain";
import { formatMw, formatTemp } from "@/lib/format";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { HungaryMap } from "@/components/dashboard/HungaryMap";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

// Renders the geographic allocation panel with a stylized industrial SVG map.
export function MapPanel({ data }: { data: ScenarioPayload }) {
  const selectedCityId = useDashboardStore((state) => state.selectedCityId);
  const setSelectedCityId = useDashboardStore((state) => state.setSelectedCityId);
  const selectedCity = data.cities.find((city) => city.id === selectedCityId) ?? data.cities[0];
  const selectedCityName = selectedCity.kind === "source" ? "Energy Hub" : selectedCity.name;

  const flowSummary = useMemo(() => {
    const servedCities = data.cities.filter((city) => city.kind === "sink").length;
    return `${servedCities} heat corridors · ${data.cities.length} nodes`;
  }, [data.cities]);

  const danubeStatusColor =
    data.danube.status === "crit" ? "#ef4444" : data.danube.status === "warn" ? "#f59e0b" : "#0891b2";

  return (
    <section className="dashboard-card flex min-h-[420px] flex-col xl:min-h-0">
      <PanelHeader title="Geographic allocation" value="Hungary · CET" accent="var(--cyan)" />

      <div className="relative min-h-0 flex-1 overflow-hidden bg-gradient-to-br from-app-primary-softer via-white to-app-sunken">
        <HungaryMap
          cities={data.cities}
          selectedCityId={selectedCityId}
          danubeStatus={data.danube.status}
          onSelectCity={setSelectedCityId}
        />

        {/* Top-left network summary chip */}
        <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100vw-40px)] rounded-lg border border-app-border bg-white/95 px-3 py-2 text-app-text shadow-soft-pop backdrop-blur-sm sm:max-w-none">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-app-primary-soft text-app-primary-strong">
              <span className="block h-1.5 w-1.5 rounded-full bg-app-primary" />
            </span>
            <span className="text-[12px] font-bold">Cogeneration network</span>
          </div>
          <div className="mono mt-1 text-[10px] tabular-nums text-app-muted">{flowSummary}</div>
        </div>

        {/* Top-right selected city detail card — hard-coded slate for guaranteed contrast */}
        <div
          className="absolute left-3 top-[84px] w-[calc(100vw-40px)] overflow-hidden rounded-lg border border-slate-700/40 shadow-soft-pop sm:left-auto sm:right-3 sm:top-3 sm:w-[212px]"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.96)" }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <span className="truncate text-[13px] font-semibold text-white">
              {selectedCityName}
            </span>
            <span className="rounded-sm border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-medium uppercase text-cyan-300">
              {selectedCity.kind === "source" ? "Source" : "Sink"}
            </span>
          </div>
          <div className="space-y-1.5 px-3 py-2.5">
            <CityRow label="Heat delivered" value={formatMw(selectedCity.heatMw)} accent />
            <CityRow
              label="Distance"
              value={selectedCity.distanceKm == null ? "—" : `${selectedCity.distanceKm} km`}
            />
            <CityRow
              label="Pipeline loss"
              value={selectedCity.pipelineLossPct == null ? "—" : `${selectedCity.pipelineLossPct.toFixed(1)}%`}
            />
            <CityRow
              label="Demand coverage"
              value={selectedCity.demandCoveragePct == null ? "—" : `${selectedCity.demandCoveragePct}%`}
              status={selectedCity.demandCoveragePct && selectedCity.demandCoveragePct > 90 ? "ok" : undefined}
            />
          </div>
        </div>

      </div>

      {/* Danube footer */}
      <div className="flex h-11 shrink-0 items-center gap-3 border-t border-app-border bg-app-sunken/40 px-5">
        <span className="text-[10px] font-semibold uppercase text-app-muted">Danube</span>
        <div className="relative h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-app-elevated ring-1 ring-inset ring-app-border">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.min(100, data.danube.pctOfLimit)}%`,
              backgroundColor: danubeStatusColor,
            }}
          />
        </div>
        <span
          className="mono w-[60px] shrink-0 text-right text-[12px] font-medium tabular-nums"
          style={{ color: danubeStatusColor }}
        >
          {formatTemp(data.danube.currentTempC)}
        </span>
        <span className="shrink-0 text-[10px] text-app-muted">
          / {formatTemp(data.danube.limitTempC)} limit
        </span>
      </div>
    </section>
  );
}

// Renders one labeled value row inside the selected-city detail card.
function CityRow({
  label,
  value,
  status,
  accent,
}: {
  label: string;
  value: string;
  status?: "ok";
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span
        className={clsx(
          "mono text-[12px] font-medium tabular-nums",
          status === "ok" ? "text-emerald-300" : accent ? "text-cyan-300" : "text-white",
        )}
      >
        {value}
      </span>
    </div>
  );
}
