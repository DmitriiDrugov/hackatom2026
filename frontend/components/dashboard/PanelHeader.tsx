// Renders the standard compact header used by dashboard panels.
export function PanelHeader({
  title,
  value,
  accent,
}: {
  title: string;
  value?: string;
  accent?: string;
}) {
  return (
    <div className="flex h-10 items-center gap-2 border-b border-app-border bg-app-sunken/60 px-4">
      <span aria-hidden className="h-3 w-[2px] rounded-full" style={{ backgroundColor: accent ?? "var(--cyan)" }} />
      <span className="panel-title">{title}</span>
      {value ? <span className="panel-meta mono ml-auto tabular-nums">{value}</span> : null}
    </div>
  );
}
