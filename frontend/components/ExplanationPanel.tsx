"use client";

import { X } from "lucide-react";

import type { ChannelKey, ScenarioPayload } from "@/lib/domain";
import { colorForChannel, formatEuro, formatMw, formatSignedEuro } from "@/lib/format";
import { useDashboardStore } from "@/lib/store/dashboard-store";

const rows: Array<{ key: ChannelKey; label: string }> = [
  { key: "electricity", label: "Electricity" },
  { key: "heat", label: "Heat" },
  { key: "hydrogen", label: "Hydrogen" },
  { key: "danubeCooling", label: "Danube" },
];

export function ExplanationPanel({ data }: { data: ScenarioPayload }) {
  const selectedHour = useDashboardStore((state) => state.selectedHour);
  const explanationOpen = useDashboardStore((state) => state.explanationOpen);
  const closeExplanation = useDashboardStore((state) => state.closeExplanation);
  const hour = data.timeline[selectedHour] ?? data.timeline[24];
  const nextLabel = `${String(((hour.hourIndex % 24) + 1) % 24).padStart(2, "0")}:00`;
  const maxAllocation = Math.max(...Object.values(hour.allocations));
  const maxMarginal = Math.max(...Object.values(hour.marginalRevenue).map((value) => Math.abs(value)), 1);

  return (
    <aside
      className="fixed bottom-0 right-0 top-12 z-40 flex w-80 flex-col overflow-hidden border-l border-app-border bg-app-surface shadow-[-4px_0_20px_rgba(0,0,0,0.4)] transition-transform duration-[220ms] ease-in-out"
      style={{ transform: explanationOpen ? "translateX(0)" : "translateX(100%)" }}
      aria-hidden={!explanationOpen}
    >
      <div className="flex items-start justify-between border-b border-app-border px-3.5 py-3">
        <div>
          <div className="mono text-[16px] text-app-cyan">
            {hour.label} - {nextLabel}
          </div>
          <div className="mt-0.5 text-[11px] text-app-muted">{hour.subtitle}</div>
        </div>
        <button
          type="button"
          title="Close"
          onClick={closeExplanation}
          className="focus-ring rounded border border-app-border p-1.5 text-app-muted transition-colors hover:border-slate-600 hover:text-app-text"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>

      <PanelSection title="Optimization gain">
        <div className="rounded border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-center">
          <div className="mono text-[20px] text-app-emerald">{formatSignedEuro(hour.savingsVsElectricEuro)}</div>
          <div className="mt-0.5 text-[11px] text-app-muted">vs full electricity output</div>
        </div>
      </PanelSection>

      <PanelSection title="Hour allocation">
        {rows.map((row) => (
          <AllocationRow
            key={row.key}
            label={row.label}
            value={formatMw(hour.allocations[row.key])}
            width={(hour.allocations[row.key] / maxAllocation) * 100}
            color={colorForChannel(row.key)}
          />
        ))}
      </PanelSection>

      <PanelSection title="Binding constraints">
        <div className="space-y-1">
          {hour.bindingConstraints.map((constraint) => (
            <div
              key={constraint.name}
              className="flex items-center justify-between rounded border border-rose-400/20 bg-rose-400/10 px-2 py-1.5"
            >
              <span className="text-[11px] text-app-text">{constraint.name}</span>
              <span className="mono text-[11px] text-app-rose">
                {constraint.current} / {constraint.limit}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Marginal revenue (€/MWh)" last>
        {(["electricity", "heat", "hydrogen"] as const).map((key) => {
          const value = hour.marginalRevenue[key];

          return (
            <AllocationRow
              key={key}
              label={key === "hydrogen" ? "Hydrogen" : key[0].toUpperCase() + key.slice(1)}
              value={value > 0 ? `+${formatEuro(value)}` : `-${formatEuro(Math.abs(value))}`}
              width={(Math.abs(value) / maxMarginal) * 100}
              color={value < 0 ? "#fb7185" : colorForChannel(key)}
              valueColor={value < 0 ? "#fb7185" : colorForChannel(key)}
            />
          );
        })}
      </PanelSection>
    </aside>
  );
}

function PanelSection({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={last ? "px-3.5 py-3" : "border-b border-app-border px-3.5 py-3"}>
      <div className="panel-label mb-2">{title}</div>
      {children}
    </section>
  );
}

function AllocationRow({
  label,
  value,
  width,
  color,
  valueColor,
}: {
  label: string;
  value: string;
  width: number;
  color: string;
  valueColor?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-2 last:mb-0">
      <span className="w-16 shrink-0 text-[11px] text-app-muted">{label}</span>
      <div className="h-[7px] min-w-0 flex-1 rounded-full bg-app-elevated">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="mono w-[58px] shrink-0 text-right text-[11px]" style={{ color: valueColor ?? "#e2e8f0" }}>
        {value}
      </span>
    </div>
  );
}
