"use client";

import { useScenarioQuery } from "@/lib/api/client";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { AllocationTopology } from "@/components/dashboard/AllocationTopology";
import { KPICards } from "@/components/dashboard/KPICards";
import { CriticalThresholds } from "@/components/dashboard/CriticalThresholds";
import { SystemReasoningLog } from "@/components/dashboard/SystemReasoningLog";
import { FooterTicker } from "@/components/dashboard/FooterTicker";

import { AlertTriangle } from "lucide-react";

export function Dashboard() {
  const activeScenario = useDashboardStore((state) => state.activeScenario);
  const query = useScenarioQuery(activeScenario);

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="font-display text-sm tracking-widest uppercase">Initializing RT-Optimizer...</div>
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-error p-8">
        <div className="bg-surface-container/60 backdrop-blur-md border border-error/50 p-6 rounded max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={24} />
            <h2 className="font-display text-xl font-bold">System Connection Error</h2>
          </div>
          <p className="font-body-md text-on-surface-variant mb-6">
            Failed to load real-time telemetry from Paks NPP servers. Ensure the RT-Brain Python process is active.
          </p>
          <button
            onClick={() => query.refetch()}
            className="w-full bg-error/10 border border-error text-error py-2 rounded-DEFAULT hover:bg-error/20 transition-colors font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="bg-background text-on-surface font-body h-screen w-screen overflow-hidden flex flex-col">
      <TopAppBar data={data} />
      
      <div className="flex-1 flex overflow-hidden w-full">
        <main className="flex-1 flex flex-col p-4 gap-4 w-full overflow-hidden" style={{ height: "calc(100vh - 48px - 32px)" }}>
          {/* Top Dashboard Area */}
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
            {/* Left Column: Flow Map */}
            <div className="col-span-3">
              <AllocationTopology data={data} />
            </div>

            {/* Center Grid: 4 Cards */}
            <div className="col-span-6">
              <KPICards data={data} />
            </div>

            {/* Right Column: Safety */}
            <div className="col-span-3">
              <CriticalThresholds data={data} />
            </div>
          </div>

          {/* Bottom Section: Terminal Log */}
          <SystemReasoningLog data={data} />
        </main>
      </div>

      <FooterTicker data={data} />
    </div>
  );
}
