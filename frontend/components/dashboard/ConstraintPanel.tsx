import clsx from "clsx";

import type { ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

export function ConstraintPanel({
  data,
  expanded = false,
}: {
  data: ScenarioPayload;
  expanded?: boolean;
}) {
  return (
    <section className="dashboard-card flex min-h-[180px] flex-col overflow-hidden xl:min-h-0">
      <PanelHeader title="Safety constraints" accent="var(--rose)" />
      <div
        className={clsx(
          "grid min-h-0 flex-1 gap-px bg-app-border",
          expanded
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6",
        )}
      >
        {data.constraints.map((constraint) => {
          const color = colorForStatus(constraint.status);
          const pct = Math.min(100, constraint.pct);
          const tintBg =
            constraint.status === "crit"
              ? "rgba(239, 68, 68, 0.06)"
              : constraint.status === "warn"
                ? "rgba(245, 158, 11, 0.06)"
                : "rgba(16, 185, 129, 0.05)";
          return (
            <div
              key={constraint.name}
              className={clsx(
                "relative flex min-w-0 flex-col gap-2 bg-app-surface",
                expanded ? "px-5 py-4" : "px-4 py-2.5",
              )}
              style={{ backgroundColor: tintBg }}
            >
              <span
                aria-hidden
                className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
                style={{ backgroundColor: color }}
              />
              <div className="flex items-start justify-between gap-2 pl-2">
                <span
                  className={clsx(
                    "panel-label leading-tight",
                    expanded ? "text-[10px]" : "text-[9px]",
                  )}
                >
                  {constraint.name}
                </span>
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

              <div className="flex min-w-0 items-baseline gap-1 pl-2">
                <span
                  className={clsx(
                    "stat-num truncate leading-none tabular-nums",
                    expanded ? "text-[26px]" : "text-[17px]",
                  )}
                  style={{ color }}
                >
                  {constraint.currentLabel}
                </span>
                <span className="mono truncate text-[10px] font-semibold tabular-nums text-app-muted">
                  / {constraint.limitLabel}
                </span>
              </div>

              <div
                className={clsx(
                  "mt-auto ml-2 overflow-hidden rounded-full bg-app-sunken ring-1 ring-inset ring-app-border",
                  expanded ? "h-1.5" : "h-1",
                )}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              {expanded ? (
                <div className="mt-1 flex justify-between pl-2 text-[10px] text-app-muted">
                  <span>{pct.toFixed(0)}% of limit</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
