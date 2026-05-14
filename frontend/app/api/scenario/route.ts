import { NextResponse } from "next/server";

import type { ScenarioInputs } from "@/lib/domain";
import { getScenarioComparison } from "@/lib/mock/scenarios";

// Mirrors the scenario POST endpoint locally until the backend service is wired in.
export async function POST(request: Request) {
  const body = (await request.json()) as ScenarioInputs;

  return NextResponse.json(getScenarioComparison(body));
}
