"use client";

import { RotateCw } from "lucide-react";

import { useScenarioQuery } from "@/lib/api/client";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { AllocationTimeline } from "@/components/dashboard/AllocationTimeline";
import { ConstraintPanel } from "@/components/dashboard/ConstraintPanel";
import { ForecastStrip } from "@/components/dashboard/ForecastStrip";
import { LiveMetricsPanel } from "@/components/dashboard/LiveMetricsPanel";
import { MapPanel } from "@/components/dashboard/MapPanel";
import { TopStatusBar } from "@/components/dashboard/TopStatusBar";
import { ExplanationPanel } from "@/components/ExplanationPanel";

export function Dashboard() {
  const activeScenario = useDashboardStore((state) => state.activeScenario);
  const setActiveScenario = useDashboardStore((state) => state.setActiveScenario);
  const query = useScenarioQuery(activeScenario);

  if (query.isLoading || query.isSlow) {
    return <DashboardSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex h-screen min-h-[720px] items-center justify-center bg-app-bg p-8 text-app-text">
        <div className="dashboard-card w-[380px] p-5">
          <div className="mb-1 text-[15px] font-semibold text-app-text">Scenario data unavailable</div>
          <p className="mb-4 text-[12px] leading-relaxed text-app-muted">
            Mock mode should serve local data from <span className="mono text-app-text-soft">/api/mock</span>. Retry
            once the dev server is ready.
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="focus-ring inline-flex h-8 items-center gap-2 rounded-md border border-app-border bg-app-elevated px-3 text-[12px] font-medium text-app-text-soft transition-colors hover:border-app-border-strong hover:bg-app-sunken"
          >
            <RotateCw size={13} strokeWidth={1.8} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="h-screen min-h-[760px] min-w-[1280px] bg-app-bg p-4 text-[13px] text-app-text">
      <main className="grid h-full grid-rows-[56px_minmax(0,1fr)_172px_104px] gap-3 overflow-hidden">
        <TopStatusBar
          activeScenario={activeScenario}
          reactors={data.reactors}
          alerts={data.alerts}
          onScenarioChange={setActiveScenario}
        />
        <div className="grid min-h-0 grid-cols-[1.55fr_1.05fr_0.85fr] gap-3 overflow-hidden">
          <MapPanel data={data} />
          <AllocationTimeline data={data} />
          <LiveMetricsPanel data={data} />
        </div>
        <ForecastStrip data={data} />
        <ConstraintPanel data={data} />
        <ExplanationPanel data={data} />
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="h-screen min-h-[760px] min-w-[1280px] bg-app-bg p-4">
      <main className="grid h-full grid-rows-[56px_minmax(0,1fr)_172px_104px] gap-3 overflow-hidden">
        <div className="dashboard-card flex items-center px-5">
          <div className="skeleton h-5 w-64 rounded" />
        </div>
        <div className="grid min-h-0 grid-cols-[1.55fr_1.05fr_0.85fr] gap-3">
          <div className="dashboard-card p-4">
            <div className="skeleton h-full rounded-md" />
          </div>
          <div className="dashboard-card p-4">
            <div className="skeleton h-full rounded-md" />
          </div>
          <div className="dashboard-card p-4">
            <div className="skeleton h-full rounded-md" />
          </div>
        </div>
        <div className="dashboard-card p-4">
          <div className="skeleton h-full rounded-md" />
        </div>
        <div className="dashboard-card p-4">
          <div className="skeleton h-full rounded-md" />
        </div>
      </main>
    </div>
  );
}
