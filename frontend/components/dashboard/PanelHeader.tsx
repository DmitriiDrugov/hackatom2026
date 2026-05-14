export function PanelHeader({ title, value }: { title: string; value?: string }) {
  return (
    <div className="flex h-[34px] items-center gap-2 border-b border-app-border px-3">
      <span className="panel-label">{title}</span>
      {value ? <span className="mono ml-auto text-[11px] text-app-muted">{value}</span> : null}
    </div>
  );
}
