import clsx from "clsx";
import { Zap } from "lucide-react";

import type { ReactorUnit, ScenarioPayload } from "@/lib/domain";
import { colorForStatus } from "@/lib/format";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

// Renders a focused unit-status view. Only the active fleet is shown here.
export function ReactorsView({ data }: { data: ScenarioPayload }) {
  const operating = data.reactors.filter((unit) => unit.group === "Paks I");
  const totalOutput = operating.reduce((sum, unit) => sum + unit.outputMw, 0);

  return (
    <section className="dashboard-card flex h-full min-h-0 flex-col">
      <PanelHeader
        title="Unit fleet"
        value={`${operating.length} units · ${totalOutput.toLocaleString("en-US")} MW total`}
        accent="var(--primary)"
      />

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-5 lg:grid-cols-4">
        {operating.map((unit) => (
          <ReactorCard key={unit.id} unit={unit} />
        ))}
      </div>
    </section>
  );
}

function ReactorCard({ unit }: { unit: ReactorUnit }) {
  const color = colorForStatus(unit.status);
  const statusLabel: Record<ReactorUnit["status"], string> = {
    ok: "Operating",
    warn: "Derated",
    crit: "Critical",
    off: "Offline",
  };

  return (
    <div
      className={clsx(
        "soft-card relative overflow-hidden p-4 transition-shadow hover:shadow-soft-pop",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 rounded-b-full"
        style={{ backgroundColor: color }}
      />
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase text-app-muted">
            {displayReactorGroup(unit.group)}
          </div>
          <div className="mt-0.5 text-[15px] font-bold text-app-text">{unit.label}</div>
        </div>
        <span
          className="grid h-9 w-9 place-items-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Zap size={16} strokeWidth={2.2} />
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="stat-num text-[28px] leading-none text-app-text">{unit.outputMw}</span>
        <span className="text-[12px] font-semibold text-app-muted">MW</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-app-border pt-3">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {statusLabel[unit.status]}
        </span>
        <span className="mono text-[10px] tabular-nums text-app-muted">{unit.id}</span>
      </div>
    </div>
  );
}

function displayReactorGroup(group: ReactorUnit["group"]) {
  return group === "Paks I" ? "Fleet A" : "Fleet B";
}
