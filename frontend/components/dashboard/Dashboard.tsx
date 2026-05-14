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
        <div className="w-[360px] rounded border border-app-border bg-app-surface p-4">
          <div className="mb-2 text-[14px] font-semibold">Scenario data failed to load</div>
          <p className="mb-4 text-[12px] text-app-muted">
            Mock mode should serve local data from /api/mock. Retry once the dev server is ready.
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="focus-ring inline-flex h-8 items-center gap-2 rounded border border-cyan-400/40 bg-app-elevated px-3 text-[12px] text-app-cyan"
          >
            <RotateCw size={14} strokeWidth={1.8} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = query.data;

  return (
    <main className="grid h-screen min-h-[720px] min-w-[1280px] grid-rows-[48px_minmax(0,1fr)_160px_104px] overflow-hidden bg-app-bg text-[13px] text-app-text">
      <TopStatusBar
        activeScenario={activeScenario}
        reactors={data.reactors}
        alerts={data.alerts}
        onScenarioChange={setActiveScenario}
      />
      <div className="grid min-h-0 grid-cols-[38%_37%_25%] overflow-hidden">
        <MapPanel data={data} />
        <AllocationTimeline data={data} />
        <LiveMetricsPanel data={data} />
      </div>
      <ForecastStrip data={data} />
      <ConstraintPanel data={data} />
      <ExplanationPanel data={data} />
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="grid h-screen min-h-[720px] min-w-[1280px] grid-rows-[48px_minmax(0,1fr)_160px_104px] overflow-hidden bg-app-bg">
      <div className="border-b border-app-border bg-app-surface px-4 py-3">
        <div className="skeleton h-5 w-64 rounded" />
      </div>
      <div className="grid min-h-0 grid-cols-[38%_37%_25%]">
        <div className="border-r border-app-border bg-app-surface p-3">
          <div className="skeleton h-full rounded" />
        </div>
        <div className="border-r border-app-border bg-app-surface p-3">
          <div className="skeleton h-full rounded" />
        </div>
        <div className="bg-app-surface p-3">
          <div className="skeleton h-full rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-app-border bg-app-surface">
        <div className="border-r border-app-border p-3">
          <div className="skeleton h-full rounded" />
        </div>
        <div className="border-r border-app-border p-3">
          <div className="skeleton h-full rounded" />
        </div>
        <div className="p-3">
          <div className="skeleton h-full rounded" />
        </div>
      </div>
      <div className="border-t border-app-border bg-app-surface p-3">
        <div className="skeleton h-full rounded" />
      </div>
    </main>
  );
}
