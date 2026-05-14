import { create } from "zustand";

import type { ScenarioKey } from "@/lib/domain";

type DashboardState = {
  activeScenario: ScenarioKey;
  selectedHour: number;
  selectedCityId: string;
  explanationOpen: boolean;
  setActiveScenario: (scenario: ScenarioKey) => void;
  setSelectedHour: (hour: number) => void;
  setSelectedCityId: (cityId: string) => void;
  openExplanation: (hour: number) => void;
  closeExplanation: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  activeScenario: "summer_negative_price",
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
  setSelectedHour: (hour) => set({ selectedHour: hour }),
  setSelectedCityId: (cityId) => set({ selectedCityId: cityId }),
  openExplanation: (hour) => set({ selectedHour: hour, explanationOpen: true }),
  closeExplanation: () => set({ explanationOpen: false }),
}));
