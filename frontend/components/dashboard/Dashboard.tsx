"use client";

import { RotateCw } from "lucide-react";

import { useScenarioQuery } from "@/lib/api/client";
import type { ScenarioPayload } from "@/lib/domain";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { AllocationTimeline } from "@/components/dashboard/AllocationTimeline";
import { ConstraintPanel } from "@/components/dashboard/ConstraintPanel";
import { ForecastStrip } from "@/components/dashboard/ForecastStrip";
import { LiveMetricsPanel } from "@/components/dashboard/LiveMetricsPanel";
import { MapPanel } from "@/components/dashboard/MapPanel";
import { ReactorsView } from "@/components/dashboard/ReactorsView";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopStatusBar } from "@/components/dashboard/TopStatusBar";
import { ExplanationPanel } from "@/components/ExplanationPanel";

export function Dashboard() {
  const activeScenario = useDashboardStore((state) => state.activeScenario);
  const activeView = useDashboardStore((state) => state.activeView);
  const setActiveScenario = useDashboardStore((state) => state.setActiveScenario);
  const setActiveView = useDashboardStore((state) => state.setActiveView);
  const query = useScenarioQuery(activeScenario);

  if (query.isLoading || query.isSlow) {
    return <DashboardSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex h-screen min-h-[720px] items-center justify-center p-8 text-app-text">
        <div className="dashboard-card w-[380px] p-5">
          <div className="mb-1 text-[15px] font-bold text-app-text">Scenario data unavailable</div>
          <p className="mb-4 text-[12px] leading-relaxed text-app-muted">
            Mock mode should serve local data from <span className="mono text-app-text-soft">/api/mock</span>. Retry
            once the dev server is ready.
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg bg-app-primary px-3.5 text-[12px] font-semibold text-white shadow-soft-pop transition-colors hover:bg-app-primary-strong"
          >
            <RotateCw size={13} strokeWidth={2.2} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="grid h-screen min-h-[680px] min-w-[1280px] grid-cols-[232px_minmax(0,1fr)] gap-3 p-3 text-[13px] text-app-text">
      <Sidebar activeView={activeView} onSelectView={setActiveView} alerts={data.alerts} />

      <main className="grid h-full min-w-0 grid-rows-[52px_minmax(0,1fr)] gap-3 overflow-hidden">
        <TopStatusBar
          activeScenario={activeScenario}
          reactors={data.reactors}
          alerts={data.alerts}
          onScenarioChange={setActiveScenario}
        />

        <div className="min-h-0 overflow-hidden">
          {activeView === "overview" && <OverviewView data={data} />}
          {activeView === "geographic" && <GeographicView data={data} />}
          {activeView === "allocation" && <AllocationView data={data} />}
          {activeView === "forecasts" && <ForecastsView data={data} />}
          {activeView === "constraints" && <ConstraintsView data={data} />}
          {activeView === "reactors" && <ReactorsView data={data} />}
        </div>
      </main>

      <ExplanationPanel data={data} />
    </div>
  );
}

// Default operator view — map + timeline + live metrics + forecasts + constraints in a balanced grid.
function OverviewView({ data }: { data: ScenarioPayload }) {
  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_148px_92px] gap-3 overflow-hidden">
      <div className="grid min-h-0 grid-cols-[1.55fr_1.05fr_0.85fr] gap-3 overflow-hidden">
        <MapPanel data={data} />
        <AllocationTimeline data={data} />
        <LiveMetricsPanel data={data} />
      </div>
      <ForecastStrip data={data} />
      <ConstraintPanel data={data} />
    </div>
  );
}

// Focused map view — map fills available space, live metrics on the right.
function GeographicView({ data }: { data: ScenarioPayload }) {
  return (
    <div className="grid h-full grid-cols-[1fr_340px] gap-3 overflow-hidden">
      <MapPanel data={data} />
      <LiveMetricsPanel data={data} />
    </div>
  );
}

// Focused 48-hour timeline view with constraints below.
function AllocationView({ data }: { data: ScenarioPayload }) {
  return (
    <div className="grid h-full grid-rows-[minmax(0,1fr)_120px] gap-3 overflow-hidden">
      <AllocationTimeline data={data} />
      <ConstraintPanel data={data} />
    </div>
  );
}

// Forecasts only — all three series stretch to the full panel height.
function ForecastsView({ data }: { data: ScenarioPayload }) {
  return (
    <div className="h-full overflow-hidden">
      <ForecastStrip data={data} expanded />
    </div>
  );
}

// Constraints only — bigger cells with extra room.
function ConstraintsView({ data }: { data: ScenarioPayload }) {
  return (
    <div className="h-full overflow-hidden">
      <ConstraintPanel data={data} expanded />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid h-screen min-h-[680px] min-w-[1280px] grid-cols-[232px_minmax(0,1fr)] gap-3 p-3">
      <div className="dashboard-card" />
      <main className="grid h-full grid-rows-[52px_minmax(0,1fr)] gap-3 overflow-hidden">
        <div className="dashboard-card flex items-center px-5">
          <div className="skeleton h-5 w-64 rounded" />
        </div>
        <div className="dashboard-card p-5">
          <div className="skeleton h-full rounded-md" />
        </div>
      </main>
    </div>
  );
}
