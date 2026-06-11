/**
 * Client-side API fallback when no Azure backend is configured.
 */
import {
  fabricIQ,
  getCrop,
  getMarketIntelligence,
  evaluateQuality,
  optimizeValueChain,
  generateSupplyContract,
} from "./js/fabric-iq-client.js";
import { getApiBase, isStaticHost } from "./js/api-client.js";

function mockFetch(url, options = {}) {
  const path = typeof url === "string" ? url : url.url;
  const method = options.method || "GET";

  const trendPct = (cropName) => {
    const crop = getCrop(cropName);
    if (!crop?.forecast?.length || !crop?.history?.length) return 0;
    const today = crop.history[crop.history.length - 1];
    return Math.round(((Math.max(...crop.forecast) - today) / today) * 100);
  };

  const cropInsights = (cropName, qtyTons = 10) => {
    const intel = getMarketIntelligence(cropName);
    const opt = optimizeValueChain({ crop: cropName, qtyTons, isOrganic: true });
    if (!intel || !opt) return null;

    const crop = getCrop(cropName);
    const peak = Math.max(...crop.forecast);
    const tick = crop.forecast.indexOf(peak) + 1;
    const trend = trendPct(cropName);
    const marginPct = Math.round((opt.addedValue / Math.max(1, opt.rawPath.net)) * 100);

    return {
      crop: cropName,
      insights: [
        {
          icon: "trending-up",
          title: "Market Timing",
          text: `Forecast peaks at $${peak.toLocaleString()}/ton in F+${tick} (${trend >= 0 ? "+" : ""}${trend}% vs today). ${trend > 8 ? "Consider holding processed inventory toward the peak." : "Spot pricing is near forecast."}`,
        },
        {
          icon: "shield-alert",
          title: "Risk Watch",
          text: `Path B requires $${opt.processedPath.processingCost.toLocaleString()} processing capital with ${intel.processor}. Lock the rate in a forward contract.`,
        },
        {
          icon: "handshake",
          title: "Negotiation Lever",
          text: `Certified premium is worth +$${intel.organicBonusPerTon}/ton. Lead with ${intel.certifications[0]} to justify ${intel.processedProduct}.`,
        },
        {
          icon: "percent",
          title: "Margin Multiplier",
          text: `Local processing lifts net profit by ~${marginPct}% over the silo route for ${qtyTons} MT.`,
        },
      ],
    };
  };

  if (path.includes("/api/status")) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          fabricIQ: { source: "in-memory", configured: false },
          foundryIQ: { configured: false, live: false },
          workIQ: { active: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
  }

  if (path.includes("/api/processors")) {
    const processors = [
      { name: "Frantoio Oleario Siciliano", inputs: "Olive Oil", costs: 350, location: "Palermo" },
      { name: "Cantina Nero d'Avola", inputs: "Grapes", costs: 250, location: "Noto" },
      { name: "Green Valley Mill", inputs: "Wheat", costs: 30, location: "Catania" },
      { name: "Artisanal Roasters Ltd", inputs: "Coffee", costs: 180, location: "Catania" },
      { name: "Highland Cheese Plant", inputs: "Milk", costs: 250, location: "Enna" },
    ];
    return Promise.resolve(
      new Response(JSON.stringify(processors), { status: 200, headers: { "Content-Type": "application/json" } })
    );
  }

  if (path.includes("/api/insights/portfolio")) {
    const qtyTons = Number(new URL(path, window.location.origin).searchParams.get("qty")) || 10;
    const rankings = Object.keys(fabricIQ.crops)
      .map((crop) => {
        const opt = optimizeValueChain({ crop, qtyTons, isOrganic: true });
        return {
          crop,
          addedValue: opt.addedValue,
          addedValuePerTon: Math.round(opt.addedValue / qtyTons),
          trendPct: trendPct(crop),
          processor: opt.processedPath.processor,
          processedProduct: opt.processedPath.processedProduct,
        };
      })
      .sort((a, b) => b.addedValue - a.addedValue);

    const top = rankings[0];
    const rising = [...rankings].sort((a, b) => b.trendPct - a.trendPct)[0];
    const narrative = `Across your ${qtyTons} MT scenario, **${top.crop}** delivers the strongest value-add at $${top.addedValue.toLocaleString()} (${top.processedProduct} via ${top.processor}). Momentum play: **${rising.crop}** shows the hottest forecast at +${rising.trendPct}%.`;

    return Promise.resolve(new Response(JSON.stringify({ qtyTons, rankings, narrative }), { status: 200, headers: { "Content-Type": "application/json" } }));
  }

  if (path.includes("/api/insights/")) {
    const crop = decodeURIComponent(path.split("/api/insights/")[1].split("?")[0]);
    const qtyTons = Number(new URL(path, window.location.origin).searchParams.get("qty")) || 10;
    const result = cropInsights(crop, qtyTons);
    if (!result) return Promise.resolve(new Response(JSON.stringify({ error: "Crop not found" }), { status: 404 }));
    return Promise.resolve(new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } }));
  }

  if (path.includes("/api/crop/")) {
    const name = decodeURIComponent(path.split("/api/crop/")[1].split("?")[0]);
    const crop = getCrop(name);
    if (!crop) return Promise.resolve(new Response(JSON.stringify({ error: "Crop not found" }), { status: 404 }));
    return Promise.resolve(new Response(JSON.stringify(crop), { status: 200, headers: { "Content-Type": "application/json" } }));
  }

  if (path.includes("/api/evaluate-quality") && method === "POST") {
    const body = JSON.parse(options.body);
    return Promise.resolve(new Response(JSON.stringify(evaluateQuality(body.crop)), { status: 200, headers: { "Content-Type": "application/json" } }));
  }

  if (path.includes("/api/optimize") && method === "POST") {
    const body = JSON.parse(options.body);
    const result = optimizeValueChain(body);
    result.iqLayers = { fabric: "in-memory", foundry: "local-rules" };
    return Promise.resolve(new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } }));
  }

  if (path.includes("/api/generate-contract") && method === "POST") {
    const body = JSON.parse(options.body);
    const contract = generateSupplyContract(body);
    return Promise.resolve(new Response(JSON.stringify({ contract }), { status: 200, headers: { "Content-Type": "application/json" } }));
  }

  if (path.includes("/api/advisor") && method === "POST") {
    const body = JSON.parse(options.body);
    const crop = body.crop || "Olive Oil";
    const lower = (body.message || "").toLowerCase();
    const intel = getMarketIntelligence(crop);
    const opt = optimizeValueChain({ crop, qtyTons: 10, isOrganic: true });
    let reply = `**Don Salvatore:** I have your ${crop} request. **Matteo** says the strongest local route is ${intel.processor} for ${intel.processedProduct}. **Sofia DOP** checks: ${intel.complianceRule} Static demo mode uses local rules; connect your own Foundry resource for live RAG.`;

    if (lower.includes("matteo") || lower.includes("yield math")) {
      reply = `**Matteo:** ${opt.agentTrace.yieldMath.yieldRule}. Estimated output: ${opt.agentTrace.yieldMath.output.toLocaleString()} ${opt.agentTrace.yieldMath.unit}. Processing plan cost: $${opt.agentTrace.yieldMath.processingCost.toLocaleString()}.`;
    } else if (lower.includes("sofia") || lower.includes("golden seal") || lower.includes("certification")) {
      reply = `**Sofia DOP:** ${opt.agentTrace.compliance.metric}: ${opt.agentTrace.compliance.observed} against ${opt.agentTrace.compliance.threshold}. ${opt.agentTrace.compliance.rule} Golden Seal: ${opt.agentTrace.goldenSeal ? "qualified" : "needs evidence"}.`;
    } else if (lower.includes("contract")) {
      reply = `**Don Salvatore:** I will package a contract with **Matteo's** yield math and **Sofia DOP's** compliance clause. Use Export Contract or Copilot MCP.`;
    }

    return Promise.resolve(new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } }));
  }

  return null;
}

export function installApiLayer() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (url, options) => {
    const path = typeof url === "string" ? url : url.url;

    // Proxy /api/* to Azure when configured (GitHub Pages + live backend)
    if (getApiBase() && path.startsWith("/api")) {
      const remote = `${getApiBase()}${path}`;
      try {
        const res = await originalFetch(remote, options);
        if (res.ok) return res;
      } catch (e) {
        console.warn("[AgriValue] Azure API unreachable, falling back:", e.message);
      }
    }

    // Pure static fallback (no Azure URL)
    if (isStaticHost() && !getApiBase()) {
      const mocked = mockFetch(url, options);
      if (mocked) return mocked;
    }

    return originalFetch(url, options);
  };

  if (getApiBase()) {
    console.info(`[AgriValue] Live API → ${getApiBase()}`);
  } else if (isStaticHost()) {
    console.info("[AgriValue] Static demo mode — client-side Fabric IQ");
  }
}

installApiLayer();
