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
      const base = getScenarioData("summer_negative_price");
      base.key = "live";
      base.label = "Live Ticker";
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

      return NextResponse.json(base);
    } catch (e) {
      console.error("Live fallback:", e);
      // Fallback
      return NextResponse.json(getScenarioData("summer_negative_price"));
    }
  }

  if (!isScenarioKey(params.name)) {
    return NextResponse.json({ message: "Unknown scenario" }, { status: 404 });
  }

  return NextResponse.json(getScenarioData(params.name as any));
}
