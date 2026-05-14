"use client";

import { AlertTriangle, Bell, Flame, Search, Snowflake, Sun } from "lucide-react";
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

function Clock() {
  const [clock, setClock] = useState({ time: "--:--:--", zone: "CET" });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("hu-HU", {
        timeZone: "Europe/Budapest",
        hour12: false,
      });
      const zone =
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Europe/Budapest",
          timeZoneName: "short",
        })
          .formatToParts(now)
          .find((part) => part.type === "timeZoneName")?.value ?? "CET";

      setClock({ time, zone });
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex shrink-0 items-baseline gap-1.5">
      <span className="mono text-[12px] font-semibold tabular-nums text-app-text-soft">
        {clock.time}
      </span>
      <span className="text-[10px] font-semibold uppercase text-app-muted">{clock.zone}</span>
    </div>
  );
}

function ReactorPills({ units }: { units: ReactorUnit[] }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {units.map((unit) => (
        <span
          key={unit.id}
          title={`${unit.label} · ${unit.outputMw} MW · ${unit.status}`}
          className="relative inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[10px] font-semibold"
          style={{
            borderColor: `${colorForStatus(unit.status)}55`,
            color: colorForStatus(unit.status),
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: colorForStatus(unit.status) }}
          />
          <span className="mono tabular-nums text-app-text-soft">
            {unit.label.replace(/^Unit /, "U")}
          </span>
          <span className="mono tabular-nums">{unit.outputMw}</span>
        </span>
      ))}
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
  const operatingReactors = reactors.filter((unit) => unit.group === "Paks I");

  return (
    <header className="dashboard-card flex min-h-[52px] flex-wrap items-center gap-3 px-4 py-2 xl:flex-nowrap xl:px-5">
      {/* Search */}
      <div className="flex h-9 min-w-[220px] flex-[1_1_260px] items-center gap-2 rounded-lg border border-app-border bg-app-sunken/70 px-3 text-[12px] xl:max-w-[280px]">
        <Search size={14} strokeWidth={2.2} className="text-app-muted" />
        <input
          type="text"
          placeholder="Search reactors, constraints, hours…"
          className="min-w-0 flex-1 bg-transparent text-app-text placeholder:text-app-muted focus:outline-none"
        />
        <span className="mono hidden rounded border border-app-border bg-white px-1.5 py-0.5 text-[9px] font-semibold text-app-muted sm:inline-flex">
          ⌘K
        </span>
      </div>

      <div className="hidden h-7 w-px bg-app-border xl:block" />

      {/* Reactor pills */}
      <div className="flex min-w-[260px] flex-[1_1_320px] items-center gap-3">
        <span className="shrink-0 text-[10px] font-semibold uppercase text-app-muted">
          Reactors
        </span>
        <ReactorPills units={operatingReactors} />
      </div>

      {/* Scenario switcher */}
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="hidden text-[10px] font-semibold uppercase text-app-muted sm:inline">
          Scenario
        </span>
        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-app-border bg-app-sunken/70 p-0.5">
          {scenarioButtons.map(({ key, label, Icon }) => {
            const isActive = activeScenario === key;
            return (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => onScenarioChange(key)}
                className={clsx(
                  "focus-ring flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition-all",
                  isActive
                    ? "bg-white text-app-text shadow-soft-pop"
                    : "text-app-muted hover:text-app-text-soft",
                )}
              >
                <Icon
                  size={13}
                  strokeWidth={2.2}
                  className={isActive ? "text-app-primary" : "text-app-muted"}
                />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert indicator + bell */}
      <button
        type="button"
        className={clsx(
          "focus-ring relative grid h-9 w-9 place-items-center rounded-lg border transition-colors",
          alerts > 0
            ? "border-app-rose/30 bg-rose-50 text-app-rose hover:bg-rose-100"
            : "border-app-border bg-white text-app-muted hover:bg-app-sunken",
        )}
        title={`${alerts} active alerts`}
      >
        <Bell size={15} strokeWidth={2} />
        {alerts > 0 ? (
          <span className="mono absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-app-rose px-1 text-[9px] font-bold tabular-nums text-white shadow-sm">
            {alerts}
          </span>
        ) : null}
      </button>

      <Clock />
    </header>
  );
}
