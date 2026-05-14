"use client";

import { AlertTriangle, Flame, Snowflake, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import type { ReactorUnit, ScenarioKey } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";

const scenarioButtons: Array<{
  key: ScenarioKey;
  label: string;
  Icon: typeof Sun;
}> = [
  { key: "summer_negative_price", label: "Summer afternoon", Icon: Sun },
  { key: "winter_peak_demand", label: "Winter morning", Icon: Snowflake },
  { key: "danube_overheating", label: "Heatwave crisis", Icon: Flame },
];

// Renders the Budapest-time operator clock in the top status bar.
function Clock() {
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString("hu-HU", {
          timeZone: "Europe/Budapest",
          hour12: false,
        }),
      );
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex shrink-0 items-baseline gap-1.5">
      <span className="mono text-[12px] font-medium tabular-nums text-app-text-soft">{clock}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-app-muted">CET</span>
    </div>
  );
}

function ReactorGroup({ name, units }: { name: string; units: ReactorUnit[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-app-muted">{name}</span>
      <div className="flex items-center gap-1">
        {units.map((unit) => (
          <span
            key={unit.id}
            title={`${unit.label} · ${unit.outputMw} MW · ${unit.status}`}
            className="relative inline-flex h-2 w-2 items-center justify-center rounded-full ring-1 ring-inset ring-white"
            style={{ backgroundColor: colorForStatus(unit.status) }}
          >
            {unit.status === "crit" ? (
              <span
                className="absolute inset-0 -m-[3px] animate-soft-pulse rounded-full"
                style={{ backgroundColor: colorForStatus(unit.status) }}
              />
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TopStatusBar({
  activeScenario,
  reactors,
  alerts,
  onScenarioChange,
}: {
  activeScenario: ScenarioKey;
  reactors: ReactorUnit[];
  alerts: number;
  onScenarioChange: (scenario: ScenarioKey) => void;
}) {
  const paksI = reactors.filter((unit) => unit.group === "Paks I");
  const paksII = reactors.filter((unit) => unit.group === "Paks II");

  return (
    <header className="dashboard-card grid h-full grid-cols-[auto_1px_auto_1fr_auto_1px_auto] items-center gap-4 px-5">
      <div className="flex shrink-0 items-center gap-3">
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-app-blue to-app-cyan text-white shadow-soft-pop"
        >
          <span className="mono text-[11px] font-semibold leading-none">P</span>
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[14px] font-semibold tracking-tight text-app-text">Paks NPP</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-app-muted">
            Thermal Optimizer
          </span>
        </div>
      </div>

      <div className="h-7 w-px bg-app-border" />

      <div className="flex shrink-0 items-center gap-5">
        <ReactorGroup name="Paks I" units={paksI} />
        <ReactorGroup name="Paks II" units={paksII} />
      </div>

      <div className="flex min-w-0 items-center justify-end gap-3">
        <div
          className={clsx(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            alerts > 0
              ? "border-app-rose/30 text-app-rose"
              : "border-app-border bg-app-elevated text-app-muted",
          )}
          style={alerts > 0 ? { backgroundColor: "rgba(239, 68, 68, 0.08)" } : undefined}
          title={`${alerts} active alerts`}
        >
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              alerts > 0 ? "animate-blink bg-app-rose" : "bg-app-muted",
            )}
          />
          <AlertTriangle size={12} strokeWidth={1.8} />
          <span className="mono tabular-nums">{alerts}</span>
          <span className="text-app-muted-strong">{alerts === 1 ? "alert" : "alerts"}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-app-muted">
            Scenario
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated p-0.5">
            {scenarioButtons.map(({ key, label, Icon }) => {
              const isActive = activeScenario === key;
              return (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => onScenarioChange(key)}
                  className={clsx(
                    "focus-ring flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-all",
                    isActive
                      ? "bg-app-surface text-app-text shadow-soft-pop"
                      : "text-app-muted hover:text-app-text-soft",
                  )}
                >
                  <Icon
                    size={13}
                    strokeWidth={1.8}
                    className={isActive ? "text-app-blue" : "text-app-muted"}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-7 w-px bg-app-border" />
      <Clock />
    </header>
  );
}
