import clsx from "clsx";

import type { ScenarioPayload } from "@/lib/domain";
import { colorForStatus, formatPct } from "@/lib/format";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

export function LiveMetricsPanel({ data }: { data: ScenarioPayload }) {
  const metrics = data.metrics;
  const deltaUp = metrics.deltaPct >= 0;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden bg-app-surface">
      <PanelHeader title="Live metrics" />

      <div className="border-b border-app-border px-3 py-3">
        <div className="panel-label mb-1">Revenue rate</div>
        <div className="mono text-[28px] leading-none text-app-cyan">
          {metrics.revenueRateEuroHr.toLocaleString("en-US")}
          <span className="ml-1 text-[13px] text-app-muted">€/hr</span>
        </div>
        <div className={clsx("mono mt-1 text-[11px]", deltaUp ? "text-app-emerald" : "text-app-rose")}>
          {deltaUp ? "▲" : "▼"} {formatPct(metrics.deltaPct, true)} {metrics.deltaLabel}
        </div>
      </div>

      <div className="border-b border-app-border px-3 py-2.5">
        <div className="mb-1.5 flex justify-between">
          <span className="text-[11px] text-app-muted">Thermal efficiency</span>
          <span className="mono text-[12px] text-app-emerald">{metrics.thermalEfficiencyPct.toFixed(1)}%</span>
        </div>
        <div className="h-1 rounded-full bg-app-elevated">
          <div
            className="h-full rounded-full bg-app-emerald transition-[width] duration-300"
            style={{ width: `${metrics.thermalEfficiencyPct}%` }}
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2">
        <MetricCell label="Today's revenue" value={metrics.todayRevenueMEur.toFixed(2)} unit="M€" />
        <MetricCell label="H2 produced" value={metrics.h2ProducedTonnes.toFixed(1)} unit="t" />
        <MetricCell label="Heat delivered" value={metrics.heatDeliveredMw.toLocaleString("en-US")} unit="MW" />
        <MetricCell label="Electricity out" value={metrics.electricityOutMw.toLocaleString("en-US")} unit="MW" />
      </div>

      <div className="border-t border-app-border px-3 py-2">
        <div className="panel-label mb-1.5">Active constraints</div>
        <div className="space-y-1">
          {metrics.activeConstraints.map((constraint) => (
            <div key={constraint.name} className="flex items-center gap-2">
              <span
                className={clsx(
                  "h-1.5 w-1.5 rounded-full",
                  constraint.status === "crit" && "animate-blink",
                )}
                style={{ backgroundColor: colorForStatus(constraint.status) }}
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-app-muted">{constraint.name}</span>
              <span
                className="mono text-[10px]"
                style={{ color: colorForStatus(constraint.status) }}
              >
                {constraint.current} / {constraint.limit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="border-b border-r border-app-border px-3 py-2.5 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <div className="panel-label mb-1">{label}</div>
      <div className="mono text-[17px] leading-none text-app-text">
        {value}
        <span className="ml-1 text-[10px] text-app-muted">{unit}</span>
      </div>
    </div>
  );
}
