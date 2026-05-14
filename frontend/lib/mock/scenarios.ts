import type {
  AllocationValues,
  ForecastPoint,
  ReactorUnit,
  ScenarioComparison,
  ScenarioInputs,
  ScenarioKey,
  ScenarioPayload,
  SafetyConstraint,
  Status,
  TimelineHour,
} from "@/lib/domain";

const TOTAL_THERMAL_MW = 1980;

type ScenarioSeed = {
  key: ScenarioKey;
  label: string;
  summary: string;
  alerts: number;
  revenueRateEuroHr: number;
  deltaPct: number;
  deltaLabel: string;
  efficiencyPct: number;
  todayRevenueMEur: number;
  h2ProducedTonnes: number;
  heatDeliveredMw: number;
  electricityOutMw: number;
  danubeTempC: number;
  danubeStatus: "ok" | "warn" | "crit";
  priceCurrent: number;
  heatCurrent: number;
};

const seeds: Record<ScenarioKey, ScenarioSeed> = {
  summer_negative_price: {
    key: "summer_negative_price",
    label: "Summer afternoon",
    summary: "Negative prices shift output into heat and hydrogen.",
    alerts: 2,
    revenueRateEuroHr: 84200,
    deltaPct: 12,
    deltaLabel: "vs baseline",
    efficiencyPct: 87.4,
    todayRevenueMEur: 1.82,
    h2ProducedTonnes: 4.3,
    heatDeliveredMw: 600,
    electricityOutMw: 920,
    danubeTempC: 26.3,
    danubeStatus: "warn",
    priceCurrent: -18,
    heatCurrent: 600,
  },
  winter_peak_demand: {
    key: "winter_peak_demand",
    label: "Winter morning",
    summary: "Peak demand keeps electricity and district heat near max output.",
    alerts: 1,
    revenueRateEuroHr: 142800,
    deltaPct: 8,
    deltaLabel: "vs baseline",
    efficiencyPct: 93.1,
    todayRevenueMEur: 3.22,
    h2ProducedTonnes: 1.2,
    heatDeliveredMw: 880,
    electricityOutMw: 1100,
    danubeTempC: 4.1,
    danubeStatus: "ok",
    priceCurrent: 98,
    heatCurrent: 880,
  },
  danube_overheating: {
    key: "danube_overheating",
    label: "Heatwave crisis",
    summary: "Danube temperature binds thermal output and favors hydrogen.",
    alerts: 3,
    revenueRateEuroHr: 61500,
    deltaPct: -5,
    deltaLabel: "constrained",
    efficiencyPct: 74.2,
    todayRevenueMEur: 1.41,
    h2ProducedTonnes: 5.8,
    heatDeliveredMw: 420,
    electricityOutMw: 680,
    danubeTempC: 29.4,
    danubeStatus: "crit",
    priceCurrent: 12,
    heatCurrent: 420,
  },
};

const baseReactors: ReactorUnit[] = [
  { id: "unit-1", group: "Paks I", label: "Unit 1", outputMw: 500, status: "ok" },
  { id: "unit-2", group: "Paks I", label: "Unit 2", outputMw: 500, status: "ok" },
  { id: "unit-3", group: "Paks I", label: "Unit 3", outputMw: 480, status: "warn" },
  { id: "unit-4", group: "Paks I", label: "Unit 4", outputMw: 500, status: "ok" },
  { id: "unit-5", group: "Paks II", label: "Unit 5", outputMw: 0, status: "off" },
  { id: "unit-6", group: "Paks II", label: "Unit 6", outputMw: 0, status: "off" },
];

const cities = [
  {
    id: "paks",
    name: "Paks NPP",
    kind: "source" as const,
    color: "cyan" as const,
    x: 310,
    y: 195,
    heatMw: 1980,
    distanceKm: null,
    pipelineLossPct: null,
    demandCoveragePct: null,
  },
  {
    id: "budapest",
    name: "Budapest",
    kind: "sink" as const,
    color: "purple" as const,
    x: 250,
    y: 118,
    heatMw: 320,
    distanceKm: 120,
    pipelineLossPct: 5.1,
    demandCoveragePct: 68,
  },
  {
    id: "dunaujvaros",
    name: "Dunaújváros",
    kind: "sink" as const,
    color: "cyan" as const,
    x: 295,
    y: 162,
    heatMw: 185,
    distanceKm: 42,
    pipelineLossPct: 3.2,
    demandCoveragePct: 94,
  },
  {
    id: "szekszard",
    name: "Szekszárd",
    kind: "sink" as const,
    color: "emerald" as const,
    x: 355,
    y: 225,
    heatMw: 95,
    distanceKm: 28,
    pipelineLossPct: 2.8,
    demandCoveragePct: 88,
  },
];

// Produces deterministic cyclic variation for mock forecasts and allocations.
function wave(hour: number, period: number, phase = 0) {
  return Math.sin((hour / period) * Math.PI * 2 + phase);
}

// Keeps mock values inside physical or display bounds.
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Maps percentage-of-limit values to dashboard status colors.
function statusFromPct(pct: number): "ok" | "warn" | "crit" {
  if (pct >= 97) return "crit";
  if (pct >= 86) return "warn";
  return "ok";
}

// Builds one hour of synthetic channel allocation for a demo scenario.
function makeAllocation(key: ScenarioKey, hour: number): AllocationValues {
  const dayHour = hour % 24;
  const noonWindow = dayHour >= 11 && dayHour <= 17;
  const morningPeak = dayHour >= 6 && dayHour <= 9;
  const eveningPeak = dayHour >= 17 && dayHour <= 21;

  if (key === "summer_negative_price") {
    return {
      electricity: noonWindow ? 540 + wave(hour, 8) * 28 : 980 + wave(hour, 24) * 90,
      heat: noonWindow ? 610 + wave(hour, 12, 0.7) * 32 : 440 + wave(hour, 18) * 35,
      hydrogen: noonWindow ? 680 + wave(hour, 9, 0.5) * 45 : 340 + wave(hour, 11) * 28,
      danubeCooling: noonWindow ? 150 : 110,
    };
  }

  if (key === "winter_peak_demand") {
    const peak = morningPeak || eveningPeak;
    return {
      electricity: peak ? 1080 + wave(hour, 10) * 55 : 920 + wave(hour, 24) * 60,
      heat: peak ? 720 + wave(hour, 7, 0.4) * 42 : 610 + wave(hour, 18) * 50,
      hydrogen: peak ? 110 : 250 + wave(hour, 14) * 24,
      danubeCooling: 70,
    };
  }

  return {
    electricity: 640 + wave(hour, 20) * 70,
    heat: 420 + wave(hour, 16, 0.8) * 36,
    hydrogen: 710 + wave(hour, 10, 1.2) * 50,
    danubeCooling: 210 + wave(hour, 9) * 22,
  };
}

// Scales channel allocations to the available thermal cap.
function normalizeAllocation(values: AllocationValues, cap = TOTAL_THERMAL_MW): AllocationValues {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const scale = cap / total;

  return {
    electricity: Math.round(values.electricity * scale),
    heat: Math.round(values.heat * scale),
    hydrogen: Math.round(values.hydrogen * scale),
    danubeCooling: Math.round(values.danubeCooling * scale),
  };
}

// Returns the binding constraints shown in the hour explanation panel.
function bindingRows(key: ScenarioKey, hour: number): TimelineHour["bindingConstraints"] {
  if (key === "danube_overheating") {
    return [
      { name: "Danube temp limit", current: "29.7°C", limit: "30.0°C", status: "crit" },
      { name: "Steam pressure", current: "6.62 MPa", limit: "7.0 MPa", status: "warn" },
    ];
  }

  if (key === "summer_negative_price" && hour % 24 >= 11 && hour % 24 <= 17) {
    return [
      { name: "H2 max capacity", current: "360 MW", limit: "360 MW", status: "warn" },
      { name: "Negative price floor", current: "-18 €/MWh", limit: "0 €/MWh", status: "crit" },
    ];
  }

  return [
    { name: "Thermal power", current: "1980 MW", limit: "2000 MW", status: "warn" },
  ];
}

// Creates the 48-hour rolling plan used by the dashboard timeline.
function makeTimeline(key: ScenarioKey, cap = TOTAL_THERMAL_MW): TimelineHour[] {
  return Array.from({ length: 48 }, (_, hourIndex) => {
    const hour = hourIndex % 24;
    const allocations = normalizeAllocation(makeAllocation(key, hourIndex), cap);
    const hydrogenMax = allocations.hydrogen >= 620;
    const danubeTight = key === "danube_overheating";
    const price =
      key === "summer_negative_price" && hour >= 11 && hour <= 17
        ? -18
        : key === "winter_peak_demand"
          ? 98
          : 12;

    return {
      hourIndex,
      label: `${String(hour).padStart(2, "0")}:00`,
      allocations,
      marginalRevenue: {
        electricity: price,
        heat: key === "winter_peak_demand" ? 74 : 42,
        hydrogen: key === "danube_overheating" ? 64 : 58,
      },
      bindingConstraints: bindingRows(key, hourIndex),
      savingsVsElectricEuro:
        key === "summer_negative_price"
          ? 14400 + (hour >= 11 && hour <= 17 ? 4800 : 900)
          : key === "winter_peak_demand"
            ? 8600
            : 4200,
      subtitle: [
        hydrogenMax ? "H2 near max" : null,
        danubeTight ? "Danube 0.3°C below limit" : "thermal headroom available",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });
}

// Generates bounded 48-hour forecast points for mock chart series.
function forecastPoints(
  current: number,
  spread: number,
  limit?: number,
  phase = 0,
): ForecastPoint[] {
  return Array.from({ length: 48 }, (_, hour) => {
    const trend = wave(hour, 24, phase) * spread + wave(hour, 8, phase / 2) * (spread / 3);
    return {
      hour,
      value: Number((limit ? clamp(current + trend, -40, limit + 0.2) : current + trend).toFixed(1)),
    };
  });
}

// Builds the safety constraint cells for a given demo seed.
function constraintsFor(seed: ScenarioSeed): SafetyConstraint[] {
  const danubePct = (seed.danubeTempC / 30) * 100;
  return [
    {
      name: "Danube temp",
      current: seed.danubeTempC,
      currentLabel: `${seed.danubeTempC.toFixed(1)}°C`,
      limitLabel: "30.0°C",
      pct: danubePct,
      status: seed.danubeStatus,
    },
    {
      name: "H2 capacity",
      current: seed.key === "winter_peak_demand" ? 80 : 360,
      currentLabel: seed.key === "winter_peak_demand" ? "80 MW" : "360 MW",
      limitLabel: "360 MW",
      pct: seed.key === "winter_peak_demand" ? 22 : 100,
      status: "ok",
    },
    {
      name: "Grid freq",
      current: seed.key === "danube_overheating" ? 49.98 : seed.key === "summer_negative_price" ? 50.02 : 50,
      currentLabel:
        seed.key === "danube_overheating"
          ? "49.98 Hz"
          : seed.key === "summer_negative_price"
            ? "50.02 Hz"
            : "50.00 Hz",
      limitLabel: "±0.2 Hz",
      pct: 10,
      status: "ok",
    },
    {
      name: "Thermal power",
      current: seed.key === "danube_overheating" ? 1540 : 1980,
      currentLabel: seed.key === "danube_overheating" ? "1540 MW" : "1980 MW",
      limitLabel: "2000 MW",
      pct: seed.key === "danube_overheating" ? 77 : 99,
      status: seed.key === "danube_overheating" ? "ok" : "warn",
    },
    {
      name: "Steam pressure",
      current: seed.key === "winter_peak_demand" ? 6.92 : seed.key === "danube_overheating" ? 6.62 : 6.84,
      currentLabel:
        seed.key === "winter_peak_demand"
          ? "6.92 MPa"
          : seed.key === "danube_overheating"
            ? "6.62 MPa"
            : "6.84 MPa",
      limitLabel: "7.0 MPa",
      pct: seed.key === "winter_peak_demand" ? 99 : seed.key === "danube_overheating" ? 95 : 98,
      status: "warn",
    },
    {
      name: "Coolant flow",
      current: seed.key === "winter_peak_demand" ? 4950 : seed.key === "danube_overheating" ? 4100 : 4820,
      currentLabel:
        seed.key === "winter_peak_demand"
          ? "4950 m3/h"
          : seed.key === "danube_overheating"
            ? "4100 m3/h"
            : "4820 m3/h",
      limitLabel: "5000 m3/h",
      pct: seed.key === "winter_peak_demand" ? 99 : seed.key === "danube_overheating" ? 82 : 96,
      status: seed.key === "winter_peak_demand" ? "warn" : "ok",
    },
  ];
}

// Returns a complete dashboard payload for the requested contract scenario name.
export function getScenarioData(key: ScenarioKey): ScenarioPayload {
  const seed = seeds[key];
  const constraints = constraintsFor(seed);
  const danubePct = Number(((seed.danubeTempC / 30) * 100).toFixed(1));

  return {
    key,
    label: seed.label,
    summary: seed.summary,
    alerts: seed.alerts,
    reactors: baseReactors,
    cities,
    danube: {
      currentTempC: seed.danubeTempC,
      limitTempC: 30,
      pctOfLimit: danubePct,
      status: seed.danubeStatus,
    },
    timeline: makeTimeline(key),
    metrics: {
      revenueRateEuroHr: seed.revenueRateEuroHr,
      deltaPct: seed.deltaPct,
      deltaLabel: seed.deltaLabel,
      thermalEfficiencyPct: seed.efficiencyPct,
      todayRevenueMEur: seed.todayRevenueMEur,
      h2ProducedTonnes: seed.h2ProducedTonnes,
      heatDeliveredMw: seed.heatDeliveredMw,
      electricityOutMw: seed.electricityOutMw,
      activeConstraints: constraints.slice(0, 3).map((constraint) => ({
        name: constraint.name,
        current: constraint.currentLabel,
        limit: constraint.limitLabel,
        status: constraint.status,
      })),
    },
    forecasts: {
      electricityPrice: {
        label: "Electricity price forecast",
        unit: "€/MWh",
        current: seed.priceCurrent,
        status: seed.priceCurrent < 0 ? "crit" : seed.priceCurrent > 80 ? "ok" : "warn",
        limit: 0,
        points: forecastPoints(seed.priceCurrent, key === "winter_peak_demand" ? 34 : 18, 140, 0.8),
      },
      danubeTemperature: {
        label: "Danube temperature",
        unit: "°C",
        current: seed.danubeTempC,
        status: seed.danubeStatus,
        limit: 30,
        points: forecastPoints(seed.danubeTempC, key === "winter_peak_demand" ? 0.8 : 1.1, 30, 1.2),
      },
      heatDemand: {
        label: "Heat demand",
        unit: "MW",
        current: seed.heatCurrent,
        status: "ok",
        points: forecastPoints(seed.heatCurrent, key === "winter_peak_demand" ? 130 : 72, undefined, 2.1),
      },
    },
    constraints,
  };
}

// Applies contract-shaped operator overrides and returns a mock side-by-side comparison.
export function getScenarioComparison(inputs: ScenarioInputs): ScenarioComparison {
  const baseline = getScenarioData("summer_negative_price");
  const overrides = inputs.overrides ?? {};
  const offlineReactors = new Set(overrides.reactor_offline ?? []);
  const onlineReactorCount = baseline.reactors.filter(
    (reactor) => reactor.status !== "off" && !offlineReactors.has(reactor.id),
  ).length;
  const reactorCap = Math.max(420, onlineReactorCount * 420);
  const demandFactor = overrides.demand_multiplier ?? 1;
  const priceFactor = overrides.price_multiplier ?? 1;
  const thermalCap = Math.min(TOTAL_THERMAL_MW, reactorCap);
  const danubeLimitC = overrides.danube_temp_limit ?? baseline.danube.limitTempC;
  const danubeStress = baseline.danube.currentTempC / danubeLimitC;
  const cap = Math.round(thermalCap * clamp(1 - Math.max(0, danubeStress - 0.94), 0.72, 1));

  const scenarioTimeline = baseline.timeline.map((hour) => {
    const heat = hour.allocations.heat * demandFactor;
    const electricity = hour.allocations.electricity * priceFactor;
    const adjusted = normalizeAllocation(
      {
        electricity,
        heat,
        hydrogen: hour.allocations.hydrogen * (priceFactor < 0.85 ? 1.18 : 1),
        danubeCooling: hour.allocations.danubeCooling * (danubeStress > 0.95 ? 1.2 : 1),
      },
      cap,
    );

    return {
      ...hour,
      allocations: adjusted,
      savingsVsElectricEuro: Math.round(hour.savingsVsElectricEuro * (1.02 + demandFactor / 10)),
      marginalRevenue: {
        electricity: Math.round(hour.marginalRevenue.electricity * priceFactor),
        heat: Math.round(hour.marginalRevenue.heat * demandFactor),
        hydrogen: hour.marginalRevenue.hydrogen,
      },
    };
  });

  const revenueDeltaPct = Math.round((priceFactor - 1) * 34 + (demandFactor - 1) * 22 - (1 - cap / TOTAL_THERMAL_MW) * 18);
  const revenueDeltaEuroHr = Math.round((baseline.metrics.revenueRateEuroHr * revenueDeltaPct) / 100);
  const status: Status = danubeStress > 0.98 ? "crit" : danubeStress > 0.9 ? "warn" : "ok";

  const scenario: ScenarioPayload = {
    ...baseline,
    label: "Operator scenario",
    summary: "Recomputed plan with current operator overrides.",
    timeline: scenarioTimeline,
    reactors: baseline.reactors.map((reactor) => ({
      ...reactor,
      status: offlineReactors.has(reactor.id) ? "off" : reactor.status,
    })),
    danube: {
      ...baseline.danube,
      limitTempC: danubeLimitC,
      pctOfLimit: Number(((baseline.danube.currentTempC / danubeLimitC) * 100).toFixed(1)),
      status,
    },
    metrics: {
      ...baseline.metrics,
      revenueRateEuroHr: baseline.metrics.revenueRateEuroHr + revenueDeltaEuroHr,
      deltaPct: revenueDeltaPct,
      deltaLabel: "vs baseline",
      heatDeliveredMw: Math.round(baseline.metrics.heatDeliveredMw * demandFactor),
      electricityOutMw: Math.round(baseline.metrics.electricityOutMw * priceFactor),
    },
  };

  return {
    baseline,
    scenario,
    revenueDeltaEuroHr,
    revenueDeltaPct,
  };
}

// Narrows arbitrary route params to the OpenAPI ScenarioName enum.
export function isScenarioKey(value: string): value is ScenarioKey {
  return (
    value === "summer_negative_price" ||
    value === "winter_peak_demand" ||
    value === "danube_overheating"
  );
}
