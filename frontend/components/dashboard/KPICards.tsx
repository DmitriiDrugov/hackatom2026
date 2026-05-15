import { Zap, Droplet, Flame, Snowflake } from "lucide-react";

export function KPICards({ data }: { data: any }) {
  const alloc = data.recommendation || {};
  const price = data.live_metrics?.current_price_eur || 0;

  // MW calculations
  const totalPower = 2000;
  const perc = (val: number) => Math.round((val / totalPower) * 100);

  const colorClasses: Record<string, { text: string; bg: string; border: string }> = {
    secondary: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary" },
    tertiary: { text: "text-tertiary", bg: "bg-tertiary/10", border: "border-tertiary" },
    error: { text: "text-error", bg: "bg-error/10", border: "border-error" },
    primary: { text: "text-primary", bg: "bg-primary/10", border: "border-primary" },
  };

  const cards = [
    {
      title: "ELECTRICITY GRID",
      value: alloc.elec,
      percent: perc(alloc.elec),
      color: "secondary",
      Icon: Zap,
      gain: (alloc.elec * price / 1).toFixed(0),
      currency: "€/hr"
    },
    {
      title: "HYDROGEN PRODUCTION",
      value: alloc.h2,
      percent: perc(alloc.h2),
      color: "tertiary",
      Icon: Droplet,
      gain: (alloc.h2 * 55 / 1).toFixed(0),
      currency: "€/hr"
    },
    {
      title: "DISTRICT HEATING",
      value: alloc.heat,
      percent: perc(alloc.heat),
      color: "error",
      Icon: Flame,
      gain: (alloc.heat * 45 / 1).toFixed(0),
      currency: "€/hr"
    },
    {
      title: "DANUBE COOLING",
      value: alloc.cooling,
      percent: perc(alloc.cooling),
      color: "primary",
      Icon: Snowflake,
      gain: (alloc.cooling * -5 / 1).toFixed(0),
      currency: "€/hr"
    }
  ];

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
      {cards.map((card) => {
        const cls = colorClasses[card.color];
        const Icon = card.Icon;
        return (
          <div key={card.title} className="bg-surface-container/60 backdrop-blur-md border border-outline-variant rounded p-4 flex flex-col relative group transition-all hover:border-outline">
            <div className={`font-display text-[12px] uppercase tracking-widest ${cls.text} mb-2 flex items-center gap-2`}>
              <Icon size={14} />
              {card.title}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div className="w-20 h-20 rounded-full flex items-center justify-center relative">
                 {/* Progress Ring Simulation */}
                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle 
                      cx="40" cy="40" r="36" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      className="text-surface-container-highest opacity-100"
                    />
                    <circle 
                      cx="40" cy="40" r="36" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      className={`${cls.text} opacity-80`}
                      strokeDasharray={`${card.percent * 2.26} 226`}
                    />
                 </svg>
                <span className="font-display text-sm font-bold z-10">{card.percent}%</span>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl font-bold">{Math.round(card.value)}</div>
                <div className="font-display text-[12px] text-on-surface-variant uppercase tracking-tighter">MW ALLOCATED</div>
              </div>
            </div>
            <div className={`absolute bottom-4 right-4 ${cls.bg} border ${cls.border} ${cls.text} px-2 py-1 rounded font-display text-[12px] font-bold`}>
              {Number(card.gain) > 0 ? '+' : ''}{Number(card.gain).toLocaleString()} {card.currency}
            </div>
          </div>
        );
      })}
    </div>
  );
}
