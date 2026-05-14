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
      <PanelHeader title="48-hour allocation timeline" value="MW / hour" />

      <div className="relative min-h-0 flex-1 px-3 pt-3">
        <div className="flex h-full items-end gap-[1.5px]">
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
                  "focus-ring flex min-h-[24px] flex-1 cursor-pointer flex-col-reverse overflow-hidden rounded-t-[1px] transition-opacity hover:opacity-85",
                  isCurrent && "outline outline-[1.5px] outline-offset-1 outline-app-cyan",
                  isSelected && !isCurrent && "outline outline-1 outline-offset-1 outline-[#c8d3e2]",
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
            className="pointer-events-none absolute top-3 z-20 w-[178px] rounded border border-app-border bg-app-elevated px-2.5 py-2 text-[11px]"
            style={{
              left: `min(max(${hovered.left - 89}px, 4px), calc(100% - 182px))`,
            }}
          >
            <div className="mb-1.5 text-[10px] font-semibold text-app-cyan">
              {hovered.hour.label} {hovered.hour.hourIndex < 24 ? "today" : "tomorrow"}
            </div>
            {channels.map((channel) => (
              <div key={channel.key} className="flex justify-between gap-4">
                <span style={{ color: colorForChannel(channel.key) }}>{channel.label}</span>
                <span className="mono text-app-text">{formatMw(hovered.hour.allocations[channel.key])}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mono flex h-[21px] px-3 pt-1 text-[9px] text-app-muted">
        {["00:00", "06:00", "12:00", "18:00", "+24h", "06:00", "12:00", "18:00", "+48h"].map(
          (label, index, labels) => (
            <span
              key={`${label}-${index}`}
              className={clsx(
                "flex-1",
                index === 0 ? "text-left" : index === labels.length - 1 ? "text-right" : "text-center",
              )}
            >
              {label}
            </span>
          ),
        )}
      </div>

      <div className="flex h-9 items-center gap-4 border-t border-app-border px-3">
        {channels.map((channel) => (
          <div key={channel.key} className="flex items-center gap-1.5 text-[11px] text-app-muted">
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
