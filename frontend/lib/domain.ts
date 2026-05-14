export const scenarioKeys = ["summer", "winter", "heatwave"] as const;

export type ScenarioKey = (typeof scenarioKeys)[number];
export type Status = "ok" | "warn" | "crit" | "off";
export type ReactorGroup = "Paks I" | "Paks II";
export type ChannelKey = "electricity" | "heat" | "hydrogen" | "danubeCooling";

export type ReactorUnit = {
  id: string;
  group: ReactorGroup;
  label: string;
  outputMw: number;
  status: Status;
};

export type CityAllocation = {
  id: string;
  name: string;
  kind: "source" | "sink";
  color: "cyan" | "emerald" | "purple";
  x: number;
  y: number;
  heatMw: number;
  distanceKm: number | null;
  pipelineLossPct: number | null;
  demandCoveragePct: number | null;
};

export type AllocationValues = Record<ChannelKey, number>;

export type BindingConstraint = {
  name: string;
  current: string;
  limit: string;
  status: Exclude<Status, "off">;
};

export type TimelineHour = {
  hourIndex: number;
  label: string;
  allocations: AllocationValues;
  marginalRevenue: Omit<AllocationValues, "danubeCooling">;
  bindingConstraints: BindingConstraint[];
  savingsVsElectricEuro: number;
  subtitle: string;
};

export type MetricCard = {
  label: string;
  value: string;
  unit: string;
};

export type LiveMetrics = {
  revenueRateEuroHr: number;
  deltaPct: number;
  deltaLabel: string;
  thermalEfficiencyPct: number;
  todayRevenueMEur: number;
  h2ProducedTonnes: number;
  heatDeliveredMw: number;
  electricityOutMw: number;
  activeConstraints: BindingConstraint[];
};

export type ForecastPoint = {
  hour: number;
  value: number;
};

export type ForecastSeries = {
  label: string;
  unit: string;
  current: number;
  status: Exclude<Status, "off">;
  limit?: number;
  points: ForecastPoint[];
};

export type SafetyConstraint = {
  name: string;
  current: number;
  currentLabel: string;
  limitLabel: string;
  pct: number;
  status: Exclude<Status, "off">;
};

export type ScenarioPayload = {
  key: ScenarioKey;
  label: string;
  summary: string;
  alerts: number;
  reactors: ReactorUnit[];
  cities: CityAllocation[];
  danube: {
    currentTempC: number;
    limitTempC: number;
    pctOfLimit: number;
    status: Exclude<Status, "off">;
  };
  timeline: TimelineHour[];
  metrics: LiveMetrics;
  forecasts: {
    electricityPrice: ForecastSeries;
    danubeTemperature: ForecastSeries;
    heatDemand: ForecastSeries;
  };
  constraints: SafetyConstraint[];
};

export type ScenarioInputs = {
  baseScenario: ScenarioKey;
  priceMultiplier: number;
  danubeLimitC: number;
  demandMultiplier: number;
  reactorsOnline: string[];
};

export type ScenarioComparison = {
  baseline: ScenarioPayload;
  scenario: ScenarioPayload;
  revenueDeltaEuroHr: number;
  revenueDeltaPct: number;
};
