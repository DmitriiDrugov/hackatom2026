import { NextResponse } from "next/server";

import { getScenarioData, isScenarioKey } from "@/lib/mock/scenarios";

// Serves contract-named dashboard scenario payloads from frontend-local mock data.
export function GET(_request: Request, { params }: { params: { name: string } }) {
  if (!isScenarioKey(params.name)) {
    return NextResponse.json({ message: "Unknown scenario" }, { status: 404 });
  }

  return NextResponse.json(getScenarioData(params.name));
}
