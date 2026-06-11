import React from 'react';

export default function ParcelMap({ activeCrop, onDrop }) {
  const allowDrop = (e) => e.preventDefault();
  const handleDrag = (e, crop) => e.dataTransfer.setData("crop", crop);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex-1 flex flex-col relative overflow-hidden">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>🗺️ Sicilian Interactive Exchange Map</span>
      </h3>
      
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center" onDragOver={allowDrop} onDrop={(e) => onDrop(e.dataTransfer.getData("crop"))}>
        <svg viewBox="0 0 1000 600" className="w-[95%] h-[95%] opacity-85 z-0">
          <path d="M 150 150 C 350 80, 550 100, 850 120 C 900 130, 950 350, 750 450 C 650 500, 450 480, 300 480 C 150 420, 50 350, 100 250 Z" fill="none" stroke="#1e293b" strokeWidth="3" />
          <path d="M 150 150 C 350 80, 550 100, 850 120 C 900 130, 950 350, 750 450 C 650 500, 450 480, 300 480 C 150 420, 50 350, 100 250 Z" fill="rgba(15, 23, 42, 0.4)" stroke="#334155" strokeWidth="1.5" />
        </svg>

        {/* Nodes */}
        <div className="absolute top-[35%] left-[16%] flex flex-col items-center">
          <div className="bg-emerald-600/25 border-2 border-emerald-500 p-2.5 rounded-full"><i data-lucide="home" className="w-4 h-4 text-emerald-400"></i></div>
          <span className="text-[9px] text-white font-mono bg-slate-900/80 px-2 py-0.5 rounded mt-1 border border-slate-800">Your Farm</span>
        </div>

        <div className="absolute top-[62%] left-[32%] flex flex-col items-center cursor-pointer">
          <div className="bg-emerald-500/10 border-2 border-slate-700 p-2.5 rounded-full animate-pulse"><i data-lucide="droplet" className="w-4 h-4 text-emerald-400"></i></div>
          <span className="text-[9px] text-slate-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded mt-1 border border-slate-850">Frantoio Castelvetrano</span>
        </div>

        <div className="absolute top-[45%] left-[78%] flex flex-col items-center cursor-pointer">
          <div className="bg-indigo-500/10 border-2 border-slate-700 p-2.5 rounded-full animate-pulse"><i data-lucide="wine" className="w-4 h-4 text-indigo-400"></i></div>
          <span className="text-[9px] text-slate-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded mt-1 border border-slate-850">Cantina Etna DOC</span>
        </div>
      </div>

      {/* Draggable Barn items at bottom of map */}
      <div className="mt-4 flex gap-4">
        <div draggable onDragStart={(e) => handleDrag(e, "Olive Oil")} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing">
          <span className="text-sm">🌿 Olio d'Oliva</span>
        </div>
        <div draggable onDragStart={(e) => handleDrag(e, "Grapes")} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing">
          <span className="text-sm">🍇 Nero d'Avola</span>
        </div>
      </div>
    </div>
  );
}
