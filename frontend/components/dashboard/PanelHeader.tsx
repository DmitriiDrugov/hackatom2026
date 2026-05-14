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
    <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-app-border bg-white px-4 sm:px-5">
      {accent ? (
        <span
          aria-hidden
          className="h-4 w-[3px] rounded-full"
          style={{ backgroundColor: accent }}
        />
      ) : null}
      <span className="panel-title min-w-0 truncate">{title}</span>
      {value ? <span className="panel-meta mono ml-auto hidden shrink-0 tabular-nums sm:inline">{value}</span> : null}
    </div>
  );
}
