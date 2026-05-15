"use client";

import { useEffect, useState } from "react";

export function FooterTicker({ data }: { data: any }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().split("T")[1].split(".")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const price = data.live_metrics?.current_price_eur || 0;
  const load = data.live_metrics?.current_load_mw || 0;

  return (
    <footer className="fixed bottom-0 w-full z-50 flex justify-between items-center px-6 py-1 h-8 overflow-hidden bg-surface-container-lowest border-t border-outline-variant shadow-none">
      <div className="font-display text-[12px] uppercase text-primary whitespace-nowrap overflow-hidden">
        HUPX MARKET FEED: {price.toFixed(2)} €/MWh | SYSTEM LOAD: {(load / 1000).toFixed(1)} GW | UTC: {time}
      </div>
      <div className="flex gap-6 font-display text-[12px] uppercase text-on-surface-variant shrink-0">
        <a className="hover:text-primary transition-opacity" href="#">Emergency Protocol</a>
        <a className="hover:text-primary transition-opacity" href="#">Network Status</a>
      </div>
    </footer>
  );
}
