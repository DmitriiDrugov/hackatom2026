"use client";

import { useEffect, useState, useRef } from "react";

export function SystemReasoningLog({ data }: { data: any }) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.ai_explanation) {
      const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
      const newLogs = data.ai_explanation.split(" | ").map((msg: string) => `[${timestamp}] ${msg}`);
      setLogs((prev) => [...prev, ...newLogs].slice(-50));
    }
  }, [data.timestamp, data.ai_explanation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-40 shrink-0 bg-[#04080a] border border-outline-variant rounded p-4 flex flex-col font-display text-[13px] text-primary/80 overflow-hidden relative mt-auto mb-4 w-full">
      <div className="font-display text-[10px] text-on-surface-variant mb-2 border-b border-outline-variant/50 pb-1 uppercase tracking-widest">
        SYSTEM REASONING LOG
      </div>
      <div ref={scrollRef} className="flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
        {logs.map((log, i) => {
           const time = log.match(/\[(.*?)\]/)?.[0];
           const message = log.replace(time || "", "");
           return (
             <div key={i} className="flex">
               <span className="text-secondary mr-2 shrink-0">{time}</span>
               <span className={i === logs.length - 1 ? "text-primary" : ""}>
                 {message}
                 {i === logs.length - 1 && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle"></span>}
               </span>
             </div>
           );
        })}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#04080a] to-transparent pointer-events-none"></div>
    </div>
  );
}
