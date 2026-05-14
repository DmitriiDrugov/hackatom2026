import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { ScenarioPayload } from "@/lib/domain";
import { colorForStatus, formatPct } from "@/lib/format";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

export function LiveMetricsPanel({ data }: { data: ScenarioPayload }) {
  const metrics = data.metrics;
  const deltaUp = metrics.deltaPct >= 0;
  const DeltaIcon = deltaUp ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="dashboard-card flex min-h-0 flex-col">
      <PanelHeader title="Live metrics" accent="var(--emerald)" />

      {/* Revenue hero */}
      <div className="px-5 pt-1 pb-4">
        <div className="panel-label mb-1.5">Revenue rate</div>
        <div className="flex items-baseline gap-1.5">
          <span className="stat-num text-[32px] leading-none text-app-text">
            {metrics.revenueRateEuroHr.toLocaleString("en-US")}
          </span>
          <span className="text-[12px] font-medium text-app-muted">€/hr</span>
        </div>
        <div
          className={clsx(
            "mt-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
            deltaUp ? "bg-emerald-50 text-app-emerald" : "bg-rose-50 text-app-rose",
          )}
        >
          <DeltaIcon size={12} strokeWidth={2.2} />
          <span className="mono tabular-nums">{formatPct(metrics.deltaPct, true)}</span>
          <span className="text-app-muted-strong">{metrics.deltaLabel}</span>
        </div>
      </div>

      {/* Thermal efficiency rail */}
      <div className="px-5 pb-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[11px] font-medium text-app-text-soft">Thermal efficiency</span>
          <span className="mono text-[12px] font-medium tabular-nums text-app-emerald">
            {metrics.thermalEfficiencyPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-app-elevated ring-1 ring-inset ring-app-border">
          <div
            className="h-full rounded-full bg-app-emerald transition-[width] duration-300"
            style={{ width: `${metrics.thermalEfficiencyPct}%` }}
          />
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid shrink-0 grid-cols-2 gap-px bg-app-border px-px">
        <MetricCell label="Today's revenue" value={metrics.todayRevenueMEur.toFixed(2)} unit="M€" />
        <MetricCell label="H2 produced" value={metrics.h2ProducedTonnes.toFixed(1)} unit="t" />
        <MetricCell label="Heat delivered" value={metrics.heatDeliveredMw.toLocaleString("en-US")} unit="MW" />
        <MetricCell label="Electricity out" value={metrics.electricityOutMw.toLocaleString("en-US")} unit="MW" />
      </div>

      {/* Active constraints */}
      <div className="mt-auto bg-app-sunken/50 px-5 py-3.5">
        <div className="panel-label mb-2.5">Active constraints</div>
        <div className="space-y-1.5">
          {metrics.activeConstraints.map((constraint) => {
            const color = colorForStatus(constraint.status);
            return (
              <div key={constraint.name} className="flex items-center gap-2">
                <span className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {constraint.status === "crit" ? (
                    <span
                      className="absolute inset-0 animate-soft-pulse rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-app-text-soft">{constraint.name}</span>
                <span className="mono shrink-0 text-[10px] tabular-nums" style={{ color }}>
                  {constraint.current} / {constraint.limit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MetricCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-app-surface px-5 py-3">
      <div className="panel-label mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="stat-num text-[20px] leading-none text-app-text">{value}</span>
        <span className="text-[10px] font-medium text-app-muted">{unit}</span>
      </div>
    </div>
  );
}
