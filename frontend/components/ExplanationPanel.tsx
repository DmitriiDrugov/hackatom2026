"use client";

import { X } from "lucide-react";
import clsx from "clsx";

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
      className="fixed bottom-3 right-3 top-3 z-40 flex w-[min(332px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-panel-card transition-transform duration-[220ms] ease-out"
      style={{ transform: explanationOpen ? "translateX(0)" : "translateX(calc(100% + 24px))" }}
      aria-hidden={!explanationOpen}
    >
      <div className="flex items-start justify-between border-b border-app-border bg-app-sunken/60 px-4 py-3.5">
        <div>
          <div className="text-[10px] font-semibold uppercase text-app-muted">
            Hour explanation
          </div>
          <div className="mono mt-0.5 text-[18px] font-medium tabular-nums text-app-text">
            {hour.label} <span className="text-app-muted">→</span> {nextLabel}
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-app-text-soft">{hour.subtitle}</div>
        </div>
        <button
          type="button"
          title="Close"
          onClick={closeExplanation}
          className="focus-ring -mr-1 mt-0.5 shrink-0 rounded-md border border-app-border bg-app-surface p-1.5 text-app-muted transition-colors hover:border-app-border-strong hover:bg-app-elevated hover:text-app-text"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PanelSection title="Optimization gain">
          <div className="rounded-lg bg-gradient-to-br from-app-primary-soft to-app-primary-softer px-4 py-3 text-center">
            <div className="stat-num text-[26px] leading-none text-app-primary-strong">
              {formatSignedEuro(hour.savingsVsElectricEuro)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-app-muted">vs full electricity output</div>
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
          {hour.bindingConstraints.length === 0 ? (
            <div className="rounded-md border border-dashed border-app-border bg-app-elevated px-3 py-2 text-[11px] text-app-muted">
              None at this hour
            </div>
          ) : (
            <div className="space-y-1.5">
              {hour.bindingConstraints.map((constraint) => (
                <div
                  key={constraint.name}
                  className="flex items-center justify-between rounded-md border border-app-rose/20 bg-rose-50/70 px-2.5 py-2"
                >
                  <span className="text-[11px] font-medium text-app-text">{constraint.name}</span>
                  <span className="mono text-[11px] tabular-nums text-app-rose">
                    {constraint.current} / {constraint.limit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </PanelSection>

        <PanelSection title="Marginal revenue (€/MWh)" last>
          {(["electricity", "heat", "hydrogen"] as const).map((key) => {
            const value = hour.marginalRevenue[key];
            const negative = value < 0;
            const color = negative ? "#ef4444" : colorForChannel(key);

            return (
              <AllocationRow
                key={key}
                label={key === "hydrogen" ? "Hydrogen" : key[0].toUpperCase() + key.slice(1)}
                value={value >= 0 ? `+${formatEuro(value)}` : `−${formatEuro(Math.abs(value))}`}
                width={(Math.abs(value) / maxMarginal) * 100}
                color={color}
                valueColor={color}
              />
            );
          })}
        </PanelSection>
      </div>
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
    <section
      className={clsx("px-4 py-3.5", last ? "" : "border-b border-app-border")}
    >
      <div className="panel-label mb-2.5">{title}</div>
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
    <div className="mb-2 flex items-center gap-2 last:mb-0">
      <span className="w-[70px] shrink-0 text-[11px] text-app-text-soft">{label}</span>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-app-elevated ring-1 ring-inset ring-app-border">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="mono w-[62px] shrink-0 text-right text-[11px] font-medium tabular-nums"
        style={{ color: valueColor ?? "var(--text)" }}
      >
        {value}
      </span>
    </div>
  );
}
