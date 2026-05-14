import { NextResponse } from "next/server";

import type { ScenarioInputs } from "@/lib/domain";
import { getScenarioComparison, isScenarioKey } from "@/lib/mock/scenarios";

export async function POST(request: Request) {
  const body = (await request.json()) as ScenarioInputs;

  if (!isScenarioKey(body.baseScenario)) {
    return NextResponse.json({ message: "Unknown base scenario" }, { status: 400 });
  }

  return NextResponse.json(getScenarioComparison(body));
}
