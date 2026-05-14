"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

import type { ChannelKey, ScenarioPayload, TimelineHour } from "@/lib/domain";
import { colorForChannel, formatMw } from "@/lib/format";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

const channels: Array<{ key: ChannelKey; label: string }> = [
  { key: "electricity", label: "Electricity" },
  { key: "heat", label: "Heat" },
  { key: "hydrogen", label: "Hydrogen" },
  { key: "danubeCooling", label: "Danube cooling" },
];

export function AllocationTimeline({ data }: { data: ScenarioPayload }) {
  const selectedHour = useDashboardStore((state) => state.selectedHour);
  const openExplanation = useDashboardStore((state) => state.openExplanation);
  const [hovered, setHovered] = useState<{ hour: TimelineHour; left: number } | null>(null);

  const maxTotal = useMemo(
    () =>
      Math.max(
        ...data.timeline.map((hour) =>
          Object.values(hour.allocations).reduce((sum, value) => sum + value, 0),
        ),
      ),
    [data.timeline],
  );

  return (
    <section className="flex min-h-0 flex-col overflow-hidden border-r border-app-border bg-app-surface">
      <PanelHeader title="48-hour allocation" value="MW / hour" />

      <div className="relative min-h-0 flex-1 px-4 pt-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-4 bottom-4 grid grid-rows-4"
        >
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="border-t border-dashed border-app-border/70" />
          ))}
        </div>

        <div className="relative flex h-full items-end gap-[2px]">
          {data.timeline.map((hour) => {
            const total = Object.values(hour.allocations).reduce((sum, value) => sum + value, 0);
            const heightPct = (total / maxTotal) * 100;
            const isCurrent = hour.hourIndex === 24;
            const isSelected = hour.hourIndex === selectedHour;

            return (
              <button
                key={hour.hourIndex}
                type="button"
                className={clsx(
                  "focus-ring relative flex min-h-[24px] flex-1 cursor-pointer flex-col-reverse overflow-hidden rounded-t-[2px] transition-all hover:brightness-110",
                  isCurrent && "ring-1 ring-app-blue ring-offset-1 ring-offset-app-surface",
                  isSelected && !isCurrent && "ring-1 ring-app-border-strong ring-offset-1 ring-offset-app-surface",
                )}
                style={{ height: `${heightPct}%` }}
                onMouseEnter={(event) =>
                  setHovered({
                    hour,
                    left:
                      event.currentTarget.offsetLeft +
                      event.currentTarget.offsetWidth / 2,
                  })
                }
                onMouseLeave={() => setHovered(null)}
                onClick={() => openExplanation(hour.hourIndex)}
                aria-label={`${hour.label} allocation`}
              >
                {channels.map((channel) => (
                  <span
                    key={channel.key}
                    className="w-full"
                    style={{
                      height: `${(hour.allocations[channel.key] / total) * 100}%`,
                      backgroundColor: colorForChannel(channel.key),
                    }}
                  />
                ))}
              </button>
            );
          })}
        </div>

        {hovered ? (
          <div
            className="pointer-events-none absolute top-3 z-20 w-[188px] rounded-lg border border-app-border bg-app-surface px-3 py-2.5 text-[11px] shadow-soft-pop"
            style={{
              left: `min(max(${hovered.left - 94}px, 4px), calc(100% - 192px))`,
            }}
          >
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.06em]">
              <span className="text-app-text">{hovered.hour.label}</span>
              <span className="text-app-muted">
                {hovered.hour.hourIndex < 24 ? "Today" : "Tomorrow"}
              </span>
            </div>
            {channels.map((channel) => (
              <div key={channel.key} className="flex items-baseline justify-between gap-3 py-0.5">
                <span className="flex items-center gap-1.5 text-app-text-soft">
                  <span
                    className="h-1.5 w-1.5 rounded-sm"
                    style={{ backgroundColor: colorForChannel(channel.key) }}
                  />
                  {channel.label}
                </span>
                <span className="mono tabular-nums text-app-text">
                  {formatMw(hovered.hour.allocations[channel.key])}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mono flex h-[22px] px-4 pt-1 text-[9px] font-medium uppercase tracking-wide text-app-muted">
        {["00:00", "06:00", "12:00", "18:00", "+24h", "06:00", "12:00", "18:00", "+48h"].map(
          (label, index, labels) => (
            <span
              key={`${label}-${index}`}
              className={clsx(
                "flex-1",
                index === 0 ? "text-left" : index === labels.length - 1 ? "text-right" : "text-center",
                label.startsWith("+") ? "text-app-text-soft" : "",
              )}
            >
              {label}
            </span>
          ),
        )}
      </div>

      <div className="flex h-10 items-center gap-4 border-t border-app-border bg-app-sunken/40 px-4">
        {channels.map((channel) => (
          <div key={channel.key} className="flex items-center gap-1.5 text-[11px] text-app-text-soft">
            <span
              className="h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: colorForChannel(channel.key) }}
            />
            <span>{channel.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
