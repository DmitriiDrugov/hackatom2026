import { create } from "zustand";

import type { ScenarioKey } from "@/lib/domain";

export type DashboardView =
  | "overview"
  | "geographic"
  | "allocation"
  | "forecasts"
  | "constraints"
  | "reactors";

type DashboardState = {
  activeScenario: ScenarioKey;
  activeView: DashboardView;
  selectedHour: number;
  selectedCityId: string;
  explanationOpen: boolean;
  setActiveScenario: (scenario: ScenarioKey) => void;
  setActiveView: (view: DashboardView) => void;
  setSelectedHour: (hour: number) => void;
  setSelectedCityId: (cityId: string) => void;
  openExplanation: (hour: number) => void;
  closeExplanation: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  activeScenario: "summer_negative_price",
  activeView: "overview",
  selectedHour: 24,
  selectedCityId: "dunaujvaros",
  explanationOpen: false,
  setActiveScenario: (scenario) =>
    set({
      activeScenario: scenario,
      selectedHour: 24,
      selectedCityId: "dunaujvaros",
      explanationOpen: false,
    }),
  setActiveView: (view) => set({ activeView: view }),
  setSelectedHour: (hour) => set({ selectedHour: hour }),
  setSelectedCityId: (cityId) => set({ selectedCityId: cityId }),
  openExplanation: (hour) => set({ selectedHour: hour, explanationOpen: true }),
  closeExplanation: () => set({ explanationOpen: false }),
}));
