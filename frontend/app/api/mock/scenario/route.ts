import { NextResponse } from "next/server";

import type { ScenarioInputs } from "@/lib/domain";
import { getScenarioComparison } from "@/lib/mock/scenarios";

// Returns a mock scenario comparison for contract-shaped operator overrides.
export async function POST(request: Request) {
  const body = (await request.json()) as ScenarioInputs;

  return NextResponse.json(getScenarioComparison(body));
}
