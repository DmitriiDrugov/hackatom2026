"use client";

import { AlertTriangle, Flame, Snowflake, Sun, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

import type { ReactorUnit, ScenarioKey } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";

const scenarioButtons: Array<{
  key: ScenarioKey;
  label: string;
  Icon: typeof Sun;
}> = [
  { key: "summer", label: "Summer afternoon", Icon: Sun },
  { key: "winter", label: "Winter morning", Icon: Snowflake },
  { key: "heatwave", label: "Heatwave crisis", Icon: Flame },
];

function Clock() {
  const [clock, setClock] = useState("--:--:-- CET");

  useEffect(() => {
    const tick = () => {
      setClock(
        `${new Date().toLocaleTimeString("hu-HU", {
          timeZone: "Europe/Budapest",
          hour12: false,
        })} CET`,
      );
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <div className="mono shrink-0 text-[12px] tracking-normal text-app-muted">{clock}</div>;
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
    <header className="grid h-12 grid-cols-[auto_auto_auto_1fr_auto] items-center gap-4 border-b border-app-border bg-app-surface px-4">
      <div className="shrink-0 whitespace-nowrap">
        <span className="text-[14px] font-semibold text-app-text">Paks NPP</span>
        <span className="ml-2 text-[11px] text-app-muted">Thermal Optimizer</span>
      </div>

      <div className="h-6 w-px bg-app-border" />

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] text-app-muted">Paks I</span>
        {paksI.map((unit) => (
          <span
            key={unit.id}
            title={`${unit.label} · ${unit.outputMw} MW`}
            className="h-[9px] w-[9px] rounded-full"
            style={{ backgroundColor: colorForStatus(unit.status) }}
          />
        ))}
        <span className="ml-2 text-[11px] text-app-muted">Paks II</span>
        {paksII.map((unit) => (
          <span
            key={unit.id}
            title={`${unit.label} · ${unit.outputMw} MW`}
            className="h-[9px] w-[9px] rounded-full"
            style={{ backgroundColor: colorForStatus(unit.status) }}
          />
        ))}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-3">
        <div className="flex shrink-0 items-center gap-2 rounded border border-rose-400/30 px-2 py-1 text-[11px] text-app-rose">
          <span className="h-[5px] w-[5px] animate-blink rounded-full bg-app-rose" />
          <AlertTriangle size={12} strokeWidth={1.8} />
          <span>{alerts} alerts</span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className="mr-1 shrink-0 text-[11px] text-app-muted">Scenario</span>
          {scenarioButtons.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              title={label}
              onClick={() => onScenarioChange(key)}
              className={clsx(
                "focus-ring flex h-7 shrink-0 items-center gap-1.5 rounded border px-2 text-[11px] font-medium transition-colors",
                activeScenario === key
                  ? "border-cyan-400/40 bg-app-elevated text-app-cyan"
                  : "border-app-border bg-transparent text-app-muted hover:border-slate-600 hover:bg-app-elevated hover:text-app-text",
              )}
            >
              <Icon size={13} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-6 w-px bg-app-border" />
      <div className="flex items-center gap-2">
        <TriangleAlert size={14} className="text-app-muted" strokeWidth={1.7} />
        <Clock />
      </div>
    </header>
  );
}
