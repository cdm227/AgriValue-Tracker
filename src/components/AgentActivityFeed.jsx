import React from 'react';

export default function AgentActivityFeed({ logs }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl h-44 flex flex-col overflow-hidden shrink-0">
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-850 text-[10px] font-mono tracking-wider flex justify-between">
        <span>COGNITIVE LOG CONSOLE</span>
        <span class="text-emerald-400 animate-pulse">ORCHESTRATING</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] text-emerald-500/90 space-y-1">
        {logs.map((log, index) => (
          <div key={index}>
            <span class="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
          </div>
        ))}
      </div>
    </div>
  );
}
