"use client";

import { ArrowLeft, Power, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { useScenarioMutation, useScenarioQuery } from "@/lib/api/client";
import type { ChannelKey, ReactorUnit, ScenarioComparison, ScenarioInputs, ScenarioPayload } from "@/lib/domain";
import { colorForChannel, colorForStatus, formatPct, formatSignedEuro } from "@/lib/format";

const channels: ChannelKey[] = ["electricity", "heat", "hydrogen", "danubeCooling"];

// Renders the operator what-if controls and side-by-side scenario comparison.
export function ScenarioWorkbench() {
  const baselineQuery = useScenarioQuery("summer_negative_price");
  const scenarioMutation = useScenarioMutation();
  const [reactorsOnline, setReactorsOnline] = useState<string[]>([]);
  const [priceMultiplier, setPriceMultiplier] = useState(0.82);
  const [danubeLimitC, setDanubeLimitC] = useState(30);
  const [demandMultiplier, setDemandMultiplier] = useState(1.08);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);

  useEffect(() => {
    if (baselineQuery.data && reactorsOnline.length === 0) {
      setReactorsOnline(
        baselineQuery.data.reactors.filter((reactor) => reactor.status !== "off").map((reactor) => reactor.id),
      );
    }
  }, [baselineQuery.data, reactorsOnline.length]);

  const inputs: ScenarioInputs = useMemo(
    () => ({
      overrides: {
        price_multiplier: priceMultiplier,
        danube_temp_limit: danubeLimitC,
        demand_multiplier: demandMultiplier,
        reactor_offline:
          baselineQuery.data?.reactors
            .filter((reactor) => reactor.status !== "off" && !reactorsOnline.includes(reactor.id))
            .map((reactor) => reactor.id) ?? [],
      },
      horizon_hours: 48,
    }),
    [baselineQuery.data?.reactors, danubeLimitC, demandMultiplier, priceMultiplier, reactorsOnline],
  );

  // Sends the current overrides to the scenario endpoint and displays the recomputed plan.
  const handleRecompute = async () => {
    const result = await scenarioMutation.mutateAsync(inputs);
    setComparison(result);
  };

  if (baselineQuery.isLoading || baselineQuery.isSlow || !baselineQuery.data) {
    return (
      <main className="min-h-screen bg-app-bg p-3 text-app-text">
        <div className="skeleton h-[calc(100vh-24px)] rounded-xl" />
      </main>
    );
  }

  const baseline = baselineQuery.data;
  const visibleComparison =
    comparison ??
    ({
      baseline,
      scenario: baseline,
      revenueDeltaEuroHr: 0,
      revenueDeltaPct: 0,
    } satisfies ScenarioComparison);
  const deltaUp = visibleComparison.revenueDeltaEuroHr >= 0;

  return (
    <div className="h-screen min-w-[1280px] bg-app-bg p-3">
      <main className="dashboard-shell flex h-full min-w-[1280px] flex-col overflow-hidden rounded-xl border border-app-border bg-app-surface text-app-text">
        <header className="flex h-[52px] shrink-0 items-center gap-4 border-b border-app-border bg-app-surface px-5">
          <Link
            href="/"
            className="focus-ring inline-flex h-7 items-center gap-2 rounded-md border border-app-border bg-app-elevated px-2.5 text-[12px] font-medium text-app-text-soft transition-colors hover:border-app-border-strong hover:bg-app-sunken hover:text-app-text"
          >
            <ArrowLeft size={14} strokeWidth={1.8} />
            Dashboard
          </Link>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight text-app-text">Scenario comparison</div>
            <div className="text-[11px] text-app-muted">Operator override workbench</div>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-app-border bg-app-elevated px-2.5 py-1 text-[11px] text-app-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-app-emerald" />
            <span className="mono">mock mode ready</span>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[332px_minmax(0,1fr)] overflow-hidden">
          <aside className="overflow-y-auto border-r border-app-border bg-app-sunken/40 p-5">
            <div className="panel-label mb-3">Overrides</div>
            <div className="space-y-5">
              <SliderControl
                label="Price multiplier"
                value={priceMultiplier}
                min={0.5}
                max={1.5}
                step={0.05}
                display={`${priceMultiplier.toFixed(2)}×`}
                onChange={setPriceMultiplier}
              />
              <SliderControl
                label="Danube limit"
                value={danubeLimitC}
                min={28}
                max={32}
                step={0.1}
                display={`${danubeLimitC.toFixed(1)}°C`}
                onChange={setDanubeLimitC}
              />
              <SliderControl
                label="Demand multiplier"
                value={demandMultiplier}
                min={0.7}
                max={1.4}
                step={0.05}
                display={`${demandMultiplier.toFixed(2)}×`}
                onChange={setDemandMultiplier}
              />
            </div>

            <div className="mt-7">
              <div className="panel-label mb-2.5">Reactor units</div>
              <div className="grid grid-cols-2 gap-2">
                {baseline.reactors.map((reactor) => (
                  <ReactorToggle
                    key={reactor.id}
                    reactor={reactor}
                    active={reactorsOnline.includes(reactor.id)}
                    onToggle={() =>
                      setReactorsOnline((current) =>
                        current.includes(reactor.id)
                          ? current.filter((id) => id !== reactor.id)
                          : [...current, reactor.id],
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRecompute}
              disabled={scenarioMutation.isPending}
              className="focus-ring mt-7 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-app-text text-[12px] font-medium text-white shadow-soft-pop transition-colors hover:bg-app-text-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw size={14} strokeWidth={2} className={scenarioMutation.isPending ? "animate-spin" : ""} />
              Recompute scenario
            </button>

            {scenarioMutation.isError ? (
              <div className="mt-3 rounded-md border border-app-rose/25 bg-rose-50/80 px-3 py-2 text-[12px] text-app-rose">
                Scenario request failed. Retry when the API is available.
              </div>
            ) : null}

            <div className="mt-7 rounded-lg border border-app-border bg-app-surface p-4">
              <div className="panel-label mb-2">Revenue delta</div>
              <div
                className={clsx(
                  "stat-num text-[28px] leading-none",
                  deltaUp ? "text-app-emerald" : "text-app-rose",
                )}
              >
                {formatSignedEuro(visibleComparison.revenueDeltaEuroHr)}
                <span className="ml-2 text-[13px] font-medium text-app-muted">/hr</span>
              </div>
              <div
                className={clsx(
                  "mono mt-1.5 text-[11px] font-medium tabular-nums",
                  deltaUp ? "text-app-emerald" : "text-app-rose",
                )}
              >
                {formatPct(visibleComparison.revenueDeltaPct, true)} vs baseline
              </div>
            </div>
          </aside>

          <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-app-surface">
            <div className="grid grid-cols-2 border-b border-app-border">
              <SummaryBlock title="Baseline plan" data={visibleComparison.baseline} />
              <SummaryBlock title="Scenario plan" data={visibleComparison.scenario} />
            </div>

            <div className="grid min-h-0 grid-cols-2 overflow-hidden">
              <TimelineComparison title="Baseline allocation" data={visibleComparison.baseline} />
              <TimelineComparison title="Scenario allocation" data={visibleComparison.scenario} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// Renders one numeric operator override slider.
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-app-text-soft">{label}</span>
        <span className="mono text-[12px] font-medium tabular-nums text-app-text">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full accent-app-blue"
      />
    </label>
  );
}

// Toggles whether a reactor unit is included in the scenario override.
function ReactorToggle({
  reactor,
  active,
  onToggle,
}: {
  reactor: ReactorUnit;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "focus-ring flex h-12 items-center gap-2 rounded-md border px-2.5 text-left transition-colors",
        active
          ? "border-app-emerald/35 bg-emerald-50/70 text-app-text"
          : "border-app-border bg-app-surface text-app-muted hover:border-app-border-strong",
      )}
    >
      <Power size={14} strokeWidth={1.8} style={{ color: active ? "#10b981" : colorForStatus("off") }} />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium">{reactor.label}</span>
        <span className="mono block text-[10px] tabular-nums text-app-muted">{reactor.outputMw} MW</span>
      </span>
    </button>
  );
}

// Displays compact revenue and operating-state metrics above a comparison chart.
function SummaryBlock({ title, data }: { title: string; data: ScenarioPayload }) {
  return (
    <div className="border-r border-app-border bg-app-sunken/40 px-5 py-4 last:border-r-0">
      <div className="panel-label mb-2.5">{title}</div>
      <div className="grid grid-cols-4 gap-4">
        <SummaryMetric label="Revenue" value={data.metrics.revenueRateEuroHr.toLocaleString("en-US")} unit="€/hr" />
        <SummaryMetric label="Electricity" value={data.metrics.electricityOutMw.toLocaleString("en-US")} unit="MW" />
        <SummaryMetric label="Heat" value={data.metrics.heatDeliveredMw.toLocaleString("en-US")} unit="MW" />
        <SummaryMetric label="Danube" value={data.danube.currentTempC.toFixed(1)} unit="°C" />
      </div>
    </div>
  );
}

// Renders one compact metric value inside the scenario summary strip.
function SummaryMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="panel-label mb-1 text-[9px]">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="stat-num truncate text-[16px] leading-none text-app-text">{value}</span>
        <span className="text-[10px] font-medium text-app-muted">{unit}</span>
      </div>
    </div>
  );
}

// Draws the stacked 48-hour plan chart used in side-by-side comparison.
function TimelineComparison({ title, data }: { title: string; data: ScenarioPayload }) {
  const maxTotal = Math.max(
    ...data.timeline.map((hour) =>
      Object.values(hour.allocations).reduce((sum, value) => sum + value, 0),
    ),
  );

  return (
    <div className="flex min-h-0 flex-col overflow-hidden border-r border-app-border bg-app-surface last:border-r-0">
      <div className="flex h-10 items-center gap-2 border-b border-app-border bg-app-sunken/40 px-5">
        <span aria-hidden className="h-3 w-[2px] rounded-full bg-app-blue" />
        <div className="panel-title">{title}</div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-end gap-[2px] p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-5 top-5 bottom-5 grid grid-rows-4"
        >
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="border-t border-dashed border-app-border/70" />
          ))}
        </div>
        {data.timeline.map((hour) => {
          const total = Object.values(hour.allocations).reduce((sum, value) => sum + value, 0);

          return (
            <div
              key={hour.hourIndex}
              className="relative flex min-h-[32px] flex-1 flex-col-reverse overflow-hidden rounded-t-[2px]"
              style={{ height: `${(total / maxTotal) * 100}%` }}
              title={`${hour.label} · ${total.toLocaleString("en-US")} MW`}
            >
              {channels.map((channel) => (
                <span
                  key={channel}
                  style={{
                    height: `${(hour.allocations[channel] / total) * 100}%`,
                    backgroundColor: colorForChannel(channel),
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
