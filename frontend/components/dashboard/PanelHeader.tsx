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
    <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-app-border bg-white px-5">
      {accent ? (
        <span
          aria-hidden
          className="h-4 w-[3px] rounded-full"
          style={{ backgroundColor: accent }}
        />
      ) : null}
      <span className="panel-title">{title}</span>
      {value ? <span className="panel-meta mono ml-auto tabular-nums">{value}</span> : null}
    </div>
  );
}
