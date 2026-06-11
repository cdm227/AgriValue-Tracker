import React, { useState } from 'react';
import LandingScene from './components/LandingScene';
import AgentActivityFeed from './components/AgentActivityFeed';
import ParcelMap from './components/ParcelMap';
import ActionPlanCards from './components/ActionPlanCards';
import './styles/tokens.css';

export default function App() {
  const [started, setStart] = useState(false);
  const [logs, setLogs] = useState([]);
  const [plan, setPlan] = useState(null);
  const [assets, setAssets] = useState(null);

  const startOrchestration = (crop) => {
    setLogs(["[SYSTEM] Initiating FieldMind Sicily live co-processor..."]);
    const ws = new WebSocket("ws://localhost:3000/ws/orchestrate");

    ws.onopen = () => {
      ws.send(JSON.stringify({ zone: "ragusa", crop }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "COMPLETED") {
        setPlan(data.actionPlan);
        setAssets(data.visualAssets);
        setLogs(prev => [...prev, "[SYSTEM] Real-time agent processing completed successfully!"]);
      } else {
        setLogs(prev => [...prev, `[${data.agent}] ${data.text}`]);
      }
    };
  };

  if (!started) return <LandingScene onStart={() => setStart(true)} />;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F5F0E8] text-[#2C1810]">
      {/* Header */}
      <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 z-20">
        <div class="flex items-center gap-3">
          <div class="bg-emerald-600 text-slate-950 p-2.5 rounded-xl font-bold flex items-center justify-center">
            <i data-lucide="cpu" class="w-6 h-6 animate-pulse"></i>
          </div>
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-white leading-none">🌾 FieldMind Sicily</h1>
            <p class="text-xs text-slate-400 mt-1">Multi-Agent Agronomical Advisory Portal</p>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6 z-10">
        {/* Center map visualizer */}
        <ParcelMap activeCrop="Olive Oil" onDrop={startOrchestration} />

        {/* Right Side Task Cards & Logs */}
        <section className="w-96 flex flex-col gap-6 overflow-hidden shrink-0">
          <ActionPlanCards plan={plan} assets={assets} />
          <AgentActivityFeed logs={logs} />
        </section>
      </main>
    </div>
  );
}
