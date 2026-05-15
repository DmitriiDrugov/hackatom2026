import { AlertTriangle } from "lucide-react";

export function CriticalThresholds({ data }: { data: any }) {
  const temp = data.live_metrics?.danube_temp_c || 0;
  // Let's assume some reactor ramp value from logs or data
  const ramp = 1.2; // fallback

  const tempPercent = Math.min((temp / 30) * 100, 100);
  const rampPercent = Math.min((ramp / 5) * 100, 100);
  const isCrisis = temp > 30;

  return (
    <div className="h-full bg-surface-container/60 backdrop-blur-md border border-outline-variant rounded p-4 flex flex-col">
      <h2 className="font-display text-[12px] uppercase tracking-widest text-error mb-6 flex items-center gap-2">
        <AlertTriangle size={16} />
        CRITICAL THRESHOLDS
      </h2>
      <div className="flex-1 flex gap-8 justify-center">
        {/* Bar 1: Temp */}
        <div className="flex flex-col items-center h-full">
          <div className="font-display text-[10px] text-on-surface-variant mb-2 text-center leading-tight uppercase">DANUBE<br />TEMP</div>
          <div className="w-8 flex-1 bg-surface-container-highest border border-outline-variant rounded-t-sm relative flex items-end">
            <div className="absolute top-[20%] w-full border-t border-error border-dashed z-20"></div>
            <div className="absolute top-[20%] -right-8 font-display text-[10px] text-error font-bold">30°C</div>
            <div 
              className={`w-full transition-all duration-500 ${isCrisis ? 'bg-[#FF1744] shadow-[0_0_15px_#FF1744]' : 'bg-gradient-to-t from-primary via-secondary to-error opacity-80'}`}
              style={{ height: `${tempPercent}%` }}
            ></div>
          </div>
          <div className={`font-display text-sm font-bold mt-2 ${isCrisis ? 'text-[#FF1744]' : ''}`}>{temp.toFixed(1)}°C</div>
        </div>

        {/* Bar 2: Ramp */}
        <div className="flex flex-col items-center h-full">
          <div className="font-display text-[10px] text-on-surface-variant mb-2 text-center leading-tight uppercase">REACTOR<br />RAMP</div>
          <div className="w-8 flex-1 bg-surface-container-highest border border-outline-variant rounded-t-sm relative flex items-end">
            <div className="absolute top-[10%] w-full border-t border-error border-dashed z-20"></div>
            <div className="absolute top-[10%] -right-8 font-display text-[10px] text-error font-bold">5%</div>
            <div 
              className={`w-full bg-primary opacity-80 transition-all duration-500`}
              style={{ height: `${rampPercent}%` }}
            ></div>
          </div>
          <div className="font-display text-sm font-bold mt-2">{ramp.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
