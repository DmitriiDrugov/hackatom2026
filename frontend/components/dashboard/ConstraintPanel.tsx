import clsx from "clsx";

import type { ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

export function ConstraintPanel({ data }: { data: ScenarioPayload }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden border-t border-app-border bg-app-surface">
      <PanelHeader title="Safety constraints" />
      <div className="grid min-h-0 flex-1 grid-cols-6">
        {data.constraints.map((constraint) => (
          <div key={constraint.name} className="relative flex min-w-0 flex-col gap-1 border-r border-app-border px-3 py-2 last:border-r-0">
            <span
              className={clsx(
                "absolute right-2 top-2 h-1.5 w-1.5 rounded-full",
                constraint.status === "crit" && "animate-blink",
              )}
              style={{ backgroundColor: colorForStatus(constraint.status) }}
            />
            <div className="panel-label truncate text-[9px]">{constraint.name}</div>
            <div className="flex min-w-0 items-baseline gap-1">
              <span className="mono truncate text-[15px] leading-none" style={{ color: colorForStatus(constraint.status) }}>
                {constraint.currentLabel}
              </span>
              <span className="mono truncate text-[9px] text-app-muted">/ {constraint.limitLabel}</span>
            </div>
            <div className="mt-auto h-[3px] rounded-full bg-app-elevated">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, constraint.pct)}%`,
                  backgroundColor: colorForStatus(constraint.status),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
