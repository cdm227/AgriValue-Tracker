import React from 'react';

export default function ActionPlanCards({ plan, assets }) {
  if (!plan) return null;
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col h-[300px] overflow-hidden shrink-0 font-sans">
      <h3 className="text-sm font-bold text-white mb-3">📋 Daily Action Plan</h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {plan.tasks.map((task, idx) => (
          <div key={idx} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-2">
            <div className="flex justify-between font-mono text-[10px] text-indigo-400 font-bold">
              <span>{task.time_window}</span>
              <span>{task.parcel_id}</span>
            </div>
            <p className="font-bold text-white text-sm">{task.action}</p>
            <p className="text-slate-400 text-[10px] leading-relaxed">{task.reason}</p>
            <div className="bg-emerald-950/20 border border-emerald-500/10 p-2 rounded-lg text-[9px]">
              <span className="font-bold text-emerald-400 block uppercase">Foundry IQ Grounding</span>
              <p className="text-slate-300 mt-0.5">{task.citation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
