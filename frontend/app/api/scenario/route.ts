import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get("scenario") || "live";

  try {
    const rootDir = path.join(process.cwd(), "..");
    let filePath = path.join(rootDir, "live_status.json");

    if (scenario === "backtest") {
      filePath = path.join(rootDir, "simulation_results.json");
    }

    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading scenario data:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // For now, we'll just return the live data even on POST
  // as the user wants real output from Python.
  return GET(request);
}
