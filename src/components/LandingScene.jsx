import React from 'react';

export default function LandingScene({ onStart }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 z-50">
      <div className="max-w-xl text-center space-y-6 bg-slate-900/80 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
        <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Cormorant display</span>
        <h1 class="text-3xl font-black text-white leading-none">🌾 FieldMind Sicily</h1>
        <p className="text-slate-400 text-xs italic leading-relaxed">
          "Your AI agronomist who knows your land, your crops, and your day. Grounded in Microsoft Fabric and Foundry IQ."
        </p>
        <button onClick={onStart} className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95">
          Consult Advisor
        </button>
      </div>
    </div>
  );
}
