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
    <div className="flex h-11 shrink-0 items-center gap-2 px-5">
      {accent ? (
        <span
          aria-hidden
          className="h-3.5 w-[2px] rounded-full"
          style={{ backgroundColor: accent }}
        />
      ) : null}
      <span className="panel-title">{title}</span>
      {value ? <span className="panel-meta mono ml-auto tabular-nums">{value}</span> : null}
    </div>
  );
}
