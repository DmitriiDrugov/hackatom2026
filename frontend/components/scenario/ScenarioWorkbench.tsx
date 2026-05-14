"use client";

import { ArrowLeft, Power, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { useScenarioMutation, useScenarioQuery } from "@/lib/api/client";
import type { ChannelKey, ReactorUnit, ScenarioComparison, ScenarioInputs, ScenarioPayload } from "@/lib/domain";
import { colorForChannel, colorForStatus, formatPct, formatSignedEuro } from "@/lib/format";

const channels: ChannelKey[] = ["electricity", "heat", "hydrogen", "danubeCooling"];

export function ScenarioWorkbench() {
  const baselineQuery = useScenarioQuery("summer");
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
      baseScenario: "summer",
      priceMultiplier,
      danubeLimitC,
      demandMultiplier,
      reactorsOnline,
    }),
    [danubeLimitC, demandMultiplier, priceMultiplier, reactorsOnline],
  );

  const handleRecompute = async () => {
    const result = await scenarioMutation.mutateAsync(inputs);
    setComparison(result);
  };

  if (baselineQuery.isLoading || baselineQuery.isSlow || !baselineQuery.data) {
    return (
      <main className="min-h-screen bg-app-bg p-4 text-app-text">
        <div className="skeleton h-[calc(100vh-32px)] rounded" />
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
    <main className="min-h-screen min-w-[1280px] bg-app-bg text-app-text">
      <header className="flex h-12 items-center gap-4 border-b border-app-border bg-app-surface px-4">
        <Link
          href="/"
          className="focus-ring inline-flex h-7 items-center gap-2 rounded border border-app-border px-2 text-[12px] text-app-muted hover:bg-app-elevated hover:text-app-text"
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          Dashboard
        </Link>
        <div>
          <div className="text-[14px] font-semibold">Scenario comparison</div>
          <div className="text-[11px] text-app-muted">Operator override workbench</div>
        </div>
        <div className="mono ml-auto text-[12px] text-app-muted">mock mode ready</div>
      </header>

      <div className="grid h-[calc(100vh-48px)] grid-cols-[320px_minmax(0,1fr)] overflow-hidden">
        <aside className="overflow-y-auto border-r border-app-border bg-app-surface p-4">
          <div className="panel-label mb-3">Overrides</div>
          <div className="space-y-5">
            <SliderControl
              label="Price multiplier"
              value={priceMultiplier}
              min={0.5}
              max={1.5}
              step={0.05}
              display={`${priceMultiplier.toFixed(2)}x`}
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
              display={`${demandMultiplier.toFixed(2)}x`}
              onChange={setDemandMultiplier}
            />
          </div>

          <div className="mt-6">
            <div className="panel-label mb-2">Reactor units</div>
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
            className="focus-ring mt-6 flex h-9 w-full items-center justify-center gap-2 rounded border border-cyan-400/40 bg-app-elevated text-[12px] font-medium text-app-cyan disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw size={14} strokeWidth={1.8} className={scenarioMutation.isPending ? "animate-spin" : ""} />
            Recompute
          </button>

          {scenarioMutation.isError ? (
            <div className="mt-3 rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[12px] text-app-rose">
              Scenario request failed. Retry when the API is available.
            </div>
          ) : null}

          <div className="mt-6 border-t border-app-border pt-4">
            <div className="panel-label mb-2">Revenue delta</div>
            <div className={clsx("mono text-[28px] leading-none", deltaUp ? "text-app-emerald" : "text-app-rose")}>
              {formatSignedEuro(visibleComparison.revenueDeltaEuroHr)}
              <span className="ml-2 text-[13px] text-app-muted">/hr</span>
            </div>
            <div className={clsx("mono mt-1 text-[11px]", deltaUp ? "text-app-emerald" : "text-app-rose")}>
              {formatPct(visibleComparison.revenueDeltaPct, true)} vs baseline
            </div>
          </div>
        </aside>

        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-app-bg">
          <div className="grid grid-cols-2 border-b border-app-border bg-app-surface">
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
  );
}

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
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-app-muted">{label}</span>
        <span className="mono text-[12px] text-app-text">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full accent-sky-400"
      />
    </label>
  );
}

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
        "focus-ring flex h-11 items-center gap-2 rounded border px-2 text-left transition-colors",
        active
          ? "border-emerald-400/30 bg-emerald-400/10 text-app-text"
          : "border-app-border bg-transparent text-app-muted",
      )}
    >
      <Power size={14} strokeWidth={1.8} style={{ color: active ? "#34d399" : colorForStatus("off") }} />
      <span className="min-w-0">
        <span className="block truncate text-[12px]">{reactor.label}</span>
        <span className="mono block text-[10px] text-app-muted">{reactor.outputMw} MW</span>
      </span>
    </button>
  );
}

function SummaryBlock({ title, data }: { title: string; data: ScenarioPayload }) {
  return (
    <div className="border-r border-app-border px-4 py-3 last:border-r-0">
      <div className="panel-label mb-2">{title}</div>
      <div className="grid grid-cols-4 gap-3">
        <SummaryMetric label="Revenue" value={data.metrics.revenueRateEuroHr.toLocaleString("en-US")} unit="€/hr" />
        <SummaryMetric label="Electricity" value={data.metrics.electricityOutMw.toLocaleString("en-US")} unit="MW" />
        <SummaryMetric label="Heat" value={data.metrics.heatDeliveredMw.toLocaleString("en-US")} unit="MW" />
        <SummaryMetric label="Danube" value={data.danube.currentTempC.toFixed(1)} unit="°C" />
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="panel-label mb-1 text-[9px]">{label}</div>
      <div className="mono truncate text-[16px] text-app-text">
        {value}
        <span className="ml-1 text-[10px] text-app-muted">{unit}</span>
      </div>
    </div>
  );
}

function TimelineComparison({ title, data }: { title: string; data: ScenarioPayload }) {
  const maxTotal = Math.max(
    ...data.timeline.map((hour) =>
      Object.values(hour.allocations).reduce((sum, value) => sum + value, 0),
    ),
  );

  return (
    <div className="flex min-h-0 flex-col overflow-hidden border-r border-app-border bg-app-surface last:border-r-0">
      <div className="flex h-9 items-center border-b border-app-border px-4">
        <div className="panel-label">{title}</div>
      </div>
      <div className="flex min-h-0 flex-1 items-end gap-[2px] p-4">
        {data.timeline.map((hour) => {
          const total = Object.values(hour.allocations).reduce((sum, value) => sum + value, 0);

          return (
            <div
              key={hour.hourIndex}
              className="flex min-h-[32px] flex-1 flex-col-reverse overflow-hidden rounded-t-[1px]"
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
