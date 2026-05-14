"use client";

import Link from "next/link";
import clsx from "clsx";
import {
  Activity,
  GitCompareArrows,
  Globe2,
  LayoutGrid,
  LineChart,
  LogOut,
  Settings,
  ShieldAlert,
  Zap,
} from "lucide-react";

import type { DashboardView } from "@/lib/store/dashboard-store";

type NavItem = {
  id: DashboardView;
  label: string;
  icon: typeof LayoutGrid;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "geographic", label: "Geographic", icon: Globe2 },
      { id: "allocation", label: "Allocation plan", icon: Activity },
    ],
  },
  {
    label: "Intelligence",
    items: [{ id: "forecasts", label: "Forecasts", icon: LineChart }],
  },
  {
    label: "Safety",
    items: [
      { id: "constraints", label: "Constraints", icon: ShieldAlert, badge: "live" },
      { id: "reactors", label: "Reactors", icon: Zap },
    ],
  },
];

export function Sidebar({
  activeView,
  onSelectView,
  alerts,
}: {
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  alerts: number;
}) {
  return (
    <aside className="dashboard-card flex min-w-0 flex-col xl:h-full xl:w-[232px] xl:shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-3 xl:px-5 xl:py-5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-app-primary to-emerald-400 text-white shadow-soft-pop">
          <Zap size={18} strokeWidth={2.4} fill="currentColor" stroke="white" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold text-app-text">ThermalOps</span>
          <span className="text-[10px] font-semibold uppercase text-app-muted">
            Allocation Optimizer
          </span>
        </div>
      </div>

      {/* Status pill */}
      <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-primary-softer px-3 py-2 xl:mb-5">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2 items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-app-primary" />
            <span className="absolute inset-0 -m-[3px] animate-soft-pulse rounded-full bg-app-primary" />
          </span>
          <span className="text-[11px] font-semibold text-app-primary-strong">Live</span>
        </div>
        <span className="mono text-[10px] tabular-nums text-app-muted-strong">mock mode</span>
      </div>

      {/* Nav groups */}
      <nav className="grid min-w-0 grid-cols-1 gap-3 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-4 xl:block xl:flex-1 xl:overflow-y-auto xl:pb-0">
        {navGroups.map((group) => (
          <div key={group.label} className="min-w-0 xl:mb-5 xl:last:mb-0">
            <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase text-app-muted">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = activeView === item.id;
                const Icon = item.icon;
                const showBadge = item.badge === "live" && alerts > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectView(item.id)}
                    className={clsx(
                      "focus-ring group flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-app-primary-soft text-app-primary-strong"
                        : "text-app-muted-strong hover:bg-app-sunken hover:text-app-text",
                    )}
                  >
                    <span
                      className={clsx(
                        "grid h-6 w-6 shrink-0 place-items-center rounded transition-colors",
                        active
                          ? "bg-white text-app-primary-strong shadow-sm"
                          : "text-app-muted group-hover:text-app-text-soft",
                      )}
                    >
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    {showBadge ? (
                      <span className="mono rounded-full bg-app-rose px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-white">
                        {alerts}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Scenario workbench — external route */}
        <div className="min-w-0 xl:mb-5">
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase text-app-muted">
            Planning
          </div>
          <Link
            href="/scenario"
            className="focus-ring group flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-app-muted-strong transition-colors hover:bg-app-sunken hover:text-app-text"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded text-app-muted group-hover:text-app-text-soft">
              <GitCompareArrows size={14} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 truncate text-left">Scenario workbench</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="hidden border-t border-app-border bg-app-sunken/50 px-3 py-3 xl:block">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="focus-ring flex h-8 flex-1 items-center gap-2 rounded-md px-2 text-[12px] font-medium text-app-muted-strong transition-colors hover:bg-white hover:text-app-text"
          >
            <Settings size={14} strokeWidth={2} />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="focus-ring grid h-8 w-8 place-items-center rounded-md text-app-muted transition-colors hover:bg-white hover:text-app-rose"
            title="Sign out"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
