import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Droplet, Flame, FlaskConical, Zap } from "lucide-react";

import type { ScenarioPayload } from "@/lib/domain";
import { colorForStatus, formatPct } from "@/lib/format";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

export function LiveMetricsPanel({ data }: { data: ScenarioPayload }) {
  const metrics = data.metrics;
  const deltaUp = metrics.deltaPct >= 0;
  const DeltaIcon = deltaUp ? ArrowUpRight : ArrowDownRight;

  return (
    <section className="dashboard-card flex min-h-0 flex-col">
      <PanelHeader title="Live metrics" accent="var(--primary)" />

      {/* Revenue hero — tinted band for visual weight */}
      <div className="relative border-b border-app-border bg-gradient-to-br from-app-primary-soft via-white to-app-primary-softer px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="panel-label">Revenue rate</span>
          <div
            className={clsx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              deltaUp ? "bg-app-primary text-white" : "bg-app-rose text-white",
            )}
          >
            <DeltaIcon size={11} strokeWidth={2.4} />
            <span className="mono tabular-nums">{formatPct(metrics.deltaPct, true)}</span>
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="stat-num text-[30px] leading-none text-app-text">
            {metrics.revenueRateEuroHr.toLocaleString("en-US")}
          </span>
          <span className="text-[12px] font-semibold text-app-muted">€/hr</span>
        </div>
        <div className="mt-1 text-[10px] font-medium text-app-muted">{metrics.deltaLabel}</div>
      </div>

      {/* Thermal efficiency */}
      <div className="border-b border-app-border px-5 py-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold text-app-text-soft">Thermal efficiency</span>
          <span className="mono text-[12px] font-bold tabular-nums text-app-primary-strong">
            {metrics.thermalEfficiencyPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-app-sunken ring-1 ring-inset ring-app-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-app-primary to-emerald-400 transition-[width] duration-300"
            style={{ width: `${metrics.thermalEfficiencyPct}%` }}
          />
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-px bg-app-border">
        <MetricCell
          icon={Zap}
          label="Today's revenue"
          value={metrics.todayRevenueMEur.toFixed(2)}
          unit="M€"
          tint="text-app-primary-strong"
          tintBg="bg-app-primary-softer"
        />
        <MetricCell
          icon={FlaskConical}
          label="H2 produced"
          value={metrics.h2ProducedTonnes.toFixed(1)}
          unit="t"
          tint="text-app-purple"
          tintBg="bg-violet-50"
        />
        <MetricCell
          icon={Flame}
          label="Heat delivered"
          value={metrics.heatDeliveredMw.toLocaleString("en-US")}
          unit="MW"
          tint="text-app-emerald"
          tintBg="bg-emerald-50"
        />
        <MetricCell
          icon={Droplet}
          label="Electricity"
          value={metrics.electricityOutMw.toLocaleString("en-US")}
          unit="MW"
          tint="text-app-blue"
          tintBg="bg-blue-50"
        />
      </div>

      {/* Active constraints */}
      <div className="mt-auto bg-app-sunken/70 px-5 py-3">
        <div className="panel-label mb-2">Active constraints</div>
        <div className="space-y-1">
          {metrics.activeConstraints.map((constraint) => {
            const color = colorForStatus(constraint.status);
            return (
              <div key={constraint.name} className="flex items-center gap-2">
                <span className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {constraint.status === "crit" ? (
                    <span
                      className="absolute inset-0 animate-soft-pulse rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-app-text-soft">
                  {constraint.name}
                </span>
                <span className="mono shrink-0 text-[10px] font-semibold tabular-nums" style={{ color }}>
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

function MetricCell({
  icon: Icon,
  label,
  value,
  unit,
  tint,
  tintBg,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  unit: string;
  tint: string;
  tintBg: string;
}) {
  return (
    <div className="bg-app-surface px-4 py-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={clsx("grid h-5 w-5 place-items-center rounded-md", tintBg, tint)}>
          <Icon size={11} strokeWidth={2.4} />
        </span>
        <span className="panel-label text-[9px]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="stat-num text-[20px] leading-none text-app-text">{value}</span>
        <span className="text-[10px] font-semibold text-app-muted">{unit}</span>
      </div>
    </div>
  );
}
