// Renders the standard compact header used by dashboard panels.
export function PanelHeader({ title, value }: { title: string; value?: string }) {
  return (
    <div className="flex h-9 items-center gap-2 border-b border-app-border bg-app-elevated/35 px-4">
      <span className="panel-label">{title}</span>
      {value ? <span className="mono ml-auto text-[11px] text-app-muted">{value}</span> : null}
    </div>
  );
}
