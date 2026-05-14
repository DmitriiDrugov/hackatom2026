import clsx from "clsx";

import type { ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

export function ConstraintPanel({ data }: { data: ScenarioPayload }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden border-t border-app-border bg-app-surface">
      <PanelHeader title="Safety constraints" accent="var(--rose)" />
      <div className="grid min-h-0 flex-1 grid-cols-6">
        {data.constraints.map((constraint) => {
          const color = colorForStatus(constraint.status);
          const pct = Math.min(100, constraint.pct);
          return (
            <div
              key={constraint.name}
              className="relative flex min-w-0 flex-col gap-1.5 border-r border-app-border px-4 py-3 last:border-r-0"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="panel-label text-[9px] leading-tight">{constraint.name}</span>
                <span className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center">
                  <span
                    className={clsx(
                      "h-1.5 w-1.5 rounded-full",
                      constraint.status === "crit" && "animate-blink",
                    )}
                    style={{ backgroundColor: color }}
                  />
                  {constraint.status === "crit" ? (
                    <span
                      className="absolute inset-0 animate-soft-pulse rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ) : null}
                </span>
              </div>

              <div className="flex min-w-0 items-baseline gap-1">
                <span
                  className="mono truncate text-[17px] font-medium leading-none tabular-nums"
                  style={{ color }}
                >
                  {constraint.currentLabel}
                </span>
                <span className="mono truncate text-[10px] tabular-nums text-app-muted">
                  / {constraint.limitLabel}
                </span>
              </div>

              <div className="mt-auto h-1 overflow-hidden rounded-full bg-app-elevated ring-1 ring-inset ring-app-border">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
