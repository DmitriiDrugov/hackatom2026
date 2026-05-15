"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { Clock, Radio, Activity, Beaker } from "lucide-react";

export function TopAppBar({ data }: { data: any }) {
  const [time, setTime] = useState("");
  const activeScenario = useDashboardStore((state) => state.activeScenario);
  const setActiveScenario = useDashboardStore((state) => state.setActiveScenario);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().split("T")[1].split(".")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const gain = data.revenue_gain_eur_per_hour || 0;

  const scenarios = [
    { id: "live", label: "LIVE", Icon: Activity },
    { id: "backtest", label: "SIM", Icon: Beaker },
  ];

  return (
    <header className="bg-surface-container/60 backdrop-blur-md border-b border-outline-variant shadow-none w-full flex justify-between items-center px-6 py-2 z-50">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-2xl text-on-surface tracking-tighter font-bold flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </span>
          NEURAL NUCLEUS
        </h1>
        <div className="h-8 w-px bg-outline-variant ml-2"></div>
        <div className="flex bg-surface-container-highest rounded p-1 gap-1">
          {scenarios.map((s) => {
            const Icon = s.Icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveScenario(s.id as any)}
                className={`px-3 py-1 rounded text-[10px] font-display font-bold transition-all flex items-center gap-2 ${
                  activeScenario === s.id 
                  ? 'bg-primary text-background' 
                  : 'text-on-surface-variant hover:bg-surface-bright'
                }`}
              >
                <Icon size={12} className={activeScenario === s.id ? '' : 'text-primary'} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="font-display text-sm text-on-surface-variant flex items-center gap-2">
          <Clock size={16} className="text-secondary" />
          UTC: <span id="utc-clock">{time}</span>
        </div>
        <div className="flex gap-4">
          <button className="text-on-surface-variant hover:bg-surface-bright/50 transition-colors p-2 rounded flex items-center justify-center">
            <Radio size={20} />
          </button>
        </div>
        <div className="bg-primary/10 border border-primary text-primary px-4 py-2 rounded font-display text-2xl font-bold">
          GAIN: +{(gain / 400).toFixed(1)}M HUF
        </div>
      </div>
    </header>
  );
}
