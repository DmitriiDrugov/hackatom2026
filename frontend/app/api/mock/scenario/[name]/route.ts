import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { getScenarioData, isScenarioKey } from "@/lib/mock/scenarios";

// Serves contract-named dashboard scenario payloads from frontend-local mock data.
export function GET(_request: Request, { params }: { params: { name: string } }) {
  if (params.name === "live") {
    // Read live_status.json from the project root
    try {
      const liveStatusPath = path.join(process.cwd(), "..", "live_status.json");
      const liveData = JSON.parse(fs.readFileSync(liveStatusPath, "utf-8"));
      
      // We can take a base scenario like 'summer_negative_price' and update its values
      const base = getScenarioData("live");
      base.key = "live";
      base.label = "🔴 Live Ticker";
      base.summary = liveData.ai_explanation;
      base.metrics.revenueRateEuroHr = Math.round(liveData.live_metrics.current_price_eur * 2000 + liveData.revenue_gain_eur_per_hour);
      base.metrics.deltaPct = Math.round((liveData.revenue_gain_eur_per_hour / (liveData.live_metrics.current_price_eur * 2000)) * 100);
      base.metrics.electricityOutMw = liveData.recommendation.elec;
      base.metrics.h2ProducedTonnes = Number((liveData.recommendation.h2 / 55).toFixed(1));
      base.metrics.heatDeliveredMw = liveData.recommendation.heat;
      
      base.danube.currentTempC = liveData.live_metrics.danube_temp_c;
      base.danube.pctOfLimit = Math.min(100, Math.max(0, (liveData.live_metrics.danube_temp_c / 30) * 100));
      base.danube.status = liveData.live_metrics.danube_temp_c > 25 ? "warn" : "ok";
      
      base.forecasts.electricityPrice.current = liveData.live_metrics.predicted_next_price_eur;
      base.forecasts.danubeTemperature.current = liveData.live_metrics.danube_temp_c;

      if (liveData.timeline && Array.isArray(liveData.timeline)) {
        base.timeline = liveData.timeline.map((t: any, i: number) => {
          const date = new Date(t.timestamp);
          const hourStr = date.getHours().toString().padStart(2, "0") + ":00";
          
          const h2Max = t.allocation.h2 >= 360;
          const dtLimit = t.danube_temp_c > 29.7;
          
          const bindingConstraints = [];
          if (dtLimit) bindingConstraints.push({ name: "Danube temp limit", current: t.danube_temp_c.toFixed(1) + "°C", limit: "30.0°C", status: "crit" as const });
          if (h2Max) bindingConstraints.push({ name: "H2 max capacity", current: "360 MW", limit: "360 MW", status: "warn" as const });
          if (bindingConstraints.length === 0) bindingConstraints.push({ name: "Thermal power", current: "1980 MW", limit: "2000 MW", status: "warn" as const });

          return {
            hourIndex: i,
            label: hourStr,
            allocations: {
              electricity: t.allocation.elec,
              heat: t.allocation.heat,
              hydrogen: t.allocation.h2,
              danubeCooling: t.allocation.cooling
            },
            marginalRevenue: {
              electricity: t.pred_price_eur,
              heat: 45,
              hydrogen: 55
            },
            bindingConstraints,
            savingsVsElectricEuro: t.revenue_gain,
            subtitle: `AI optimized: ${t.revenue_gain > 0 ? '+' : ''}€${t.revenue_gain.toFixed(0)}`
          };
        });

        base.forecasts.electricityPrice.points = liveData.timeline.map((t: any, i: number) => ({ hour: i, value: t.pred_price_eur }));
        base.forecasts.danubeTemperature.points = liveData.timeline.map((t: any, i: number) => ({ hour: i, value: t.danube_temp_c }));
        base.forecasts.heatDemand.points = liveData.timeline.map((t: any, i: number) => ({ hour: i, value: t.allocation.heat }));
      }

      return NextResponse.json(base);
    } catch (e) {
      console.error("Live fallback:", e);
      // Fallback
      return NextResponse.json(getScenarioData("live"));
    }
  }

  if (!isScenarioKey(params.name)) {
    return NextResponse.json({ message: "Unknown scenario" }, { status: 404 });
  }

  return NextResponse.json(getScenarioData(params.name as any));
}
