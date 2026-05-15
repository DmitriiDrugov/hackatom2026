import { Zap, Droplet, Flame, Snowflake, Radiation, Share2 } from "lucide-react";

export function AllocationTopology({ data }: { data: any }) {
  const alloc = data.recommendation || {};
  const temp = data.live_metrics?.danube_temp_c || 0;
  const isCrisis = temp > 30;

  return (
    <div className="h-full bg-surface-container/60 backdrop-blur-md border border-outline-variant rounded p-4 flex flex-col relative overflow-hidden">
      <h2 className="font-display text-[12px] uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
        <Share2 size={16} />
        ALLOCATION TOPOLOGY
      </h2>
      <div className="flex-1 flex flex-col items-center justify-between relative py-8">
        {/* Connecting Lines */}
        <div className="absolute top-[20%] bottom-[20%] left-1/2 w-0.5 bg-outline-variant -translate-x-1/2 z-0"></div>
        <div className="absolute top-[40%] left-[20%] right-[20%] h-0.5 bg-outline-variant z-0"></div>
        
        {/* Core Node */}
        <div className={`z-10 w-20 h-20 rounded-full border-2 bg-surface flex items-center justify-center relative transition-all duration-500 ${isCrisis ? 'border-[#FF1744] shadow-[0_0_20px_#FF1744]' : 'border-primary shadow-[0_0_15px_rgba(117,255,158,0.3)]'}`}>
          <Radiation size={40} className={`${isCrisis ? 'text-[#FF1744]' : 'text-primary'}`} />
          <div className={`absolute -bottom-6 font-display text-[14px] ${isCrisis ? 'text-[#FF1744]' : 'text-primary'}`}>CORE</div>
        </div>

        {/* Split Nodes */}
        <div className="w-full flex justify-between z-10 px-4 mt-8">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full border ${alloc.elec > 0 ? 'border-secondary shadow-[0_0_10px_rgba(176,198,255,0.3)]' : 'border-outline-variant'} bg-surface flex items-center justify-center transition-all`}>
              <Zap size={24} className={`${alloc.elec > 0 ? 'text-secondary' : 'text-outline'}`} />
            </div>
            <span className={`font-display text-[10px] ${alloc.elec > 0 ? 'text-secondary' : 'text-outline'}`}>GRID</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full border ${alloc.h2 > 0 ? 'border-tertiary shadow-[0_0_10px_rgba(255,221,220,0.3)]' : 'border-outline-variant'} bg-surface flex items-center justify-center transition-all`}>
              <Droplet size={24} className={`${alloc.h2 > 0 ? 'text-tertiary' : 'text-outline'}`} />
            </div>
            <span className={`font-display text-[10px] ${alloc.h2 > 0 ? 'text-tertiary' : 'text-outline'}`}>H2</span>
          </div>
        </div>

        <div className="w-full flex justify-between z-10 px-4 mt-auto">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full border ${alloc.heat > 0 ? 'border-error shadow-[0_0_10px_rgba(255,180,171,0.3)]' : 'border-outline-variant'} bg-surface flex items-center justify-center transition-all`}>
              <Flame size={24} className={`${alloc.heat > 0 ? 'text-error' : 'text-outline'}`} />
            </div>
            <span className={`font-display text-[10px] ${alloc.heat > 0 ? 'text-error' : 'text-outline'}`}>HEAT</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full border ${alloc.cooling > 0 ? 'border-primary shadow-[0_0_10px_rgba(117,255,158,0.3)]' : 'border-outline-variant'} bg-surface flex items-center justify-center transition-all`}>
              <Snowflake size={24} className={`${alloc.cooling > 0 ? 'text-primary' : 'text-outline'}`} />
            </div>
            <span className={`font-display text-[10px] ${alloc.cooling > 0 ? 'text-primary' : 'text-outline'}`}>COOL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
