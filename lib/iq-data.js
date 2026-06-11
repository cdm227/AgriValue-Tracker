/**
 * Unified IQ data layer — Fabric lakehouse with in-memory fallback.
 */
import { getFabricGraph, syncFabricGraph } from "./fabric-lakehouse.js";
import {
  evaluateQuality as evalQuality,
  createAgentTrace,
  getYieldMath,
  generateSupplyContract as genContract,
} from "./fabric-iq.js";

export { CROP_NAMES } from "./fabric-iq.js";
export { syncFabricGraph, getFabricStatus } from "./fabric-lakehouse.js";

export function getCrop(name) {
  return getFabricGraph().crops[name] ?? null;
}

export function getProcessor(crop) {
  return getFabricGraph().processors.find((p) => p.inputs === crop) ?? null;
}

export function getMarketIntelligence(crop) {
  const cropData = getCrop(crop);
  const processor = getProcessor(crop);
  const graph = getFabricGraph();
  if (!cropData || !processor) return null;

  const rule = graph.complianceRules[crop];
  const bonus = graph.organicBonuses[crop];

  return {
    crop,
    region: cropData.region,
    rawPrice: cropData.basePrice,
    processedPrice: cropData.processedPrice,
    processedProduct: cropData.processedName,
    processor: processor.name,
    processorLocation: processor.location,
    processingCostPerTon: processor.costs,
    certifications: cropData.certifications,
    complianceRule: rule,
    organicBonusPerTon: bonus,
    summary: `Raw ${crop} silo: $${cropData.basePrice}/ton. ${cropData.processedName}: $${cropData.processedPrice}/ton (+ $${bonus}/ton organic premium via ${processor.name}, ${processor.location}). Rule: ${rule}`,
  };
}

export function evaluateQuality(crop) {
  return evalQuality(crop);
}

export function generateSupplyContract(opts) {
  return genContract(opts);
}

export function optimizeValueChain({ crop, qtyTons, isOrganic, qualityMultiplier = 1.0 }) {
  const cropData = getCrop(crop);
  const processor = getProcessor(crop);
  const graph = getFabricGraph();
  if (!cropData || !processor) return null;

  const rawRev = cropData.basePrice * qtyTons;
  const rawTransport = 100;
  const rawNet = rawRev - rawTransport;

  const yieldMath = getYieldMath({ crop, qtyTons });
  const procCost = yieldMath.processingCost;
  let procRev = cropData.processedPrice * qtyTons * qualityMultiplier;

  const bonusPerTon = isOrganic ? graph.organicBonuses[crop] : 0;
  const bonusApplied = bonusPerTon * qtyTons;
  procRev += bonusApplied;

  const procTransport = 150;
  const procNet = procRev - procCost - procTransport;
  const netAddedValue = Math.max(0, procNet - rawNet);
  const agentTrace = createAgentTrace({ crop, qtyTons, isOrganic, addedValue: netAddedValue });

  return {
    crop,
    qtyTons,
    isOrganic,
    qualityMultiplier,
    rawPath: { gross: rawRev, transport: rawTransport, net: rawNet },
    processedPath: {
      processor: processor.name,
      processorLocation: processor.location,
      processedProduct: cropData.processedName,
      gross: procRev,
      processingCost: procCost,
      transport: procTransport,
      net: procNet,
      foundryIQRule: graph.complianceRules[crop],
      organicBonus: bonusApplied,
    },
    addedValue: netAddedValue,
    agentTrace,
  };
}

export function getProcessorNetwork() {
  return getFabricGraph().processors.map((p) => {
    const crop = getCrop(p.inputs);
    return {
      ...p,
      region: crop?.region,
      processedProduct: crop?.processedName,
      rawPrice: crop?.basePrice,
      processedPrice: crop?.processedPrice,
    };
  });
}

function trendPct(crop) {
  const c = getCrop(crop);
  if (!c?.forecast?.length || !c?.history?.length) return 0;
  const last = c.history[c.history.length - 1];
  const peak = Math.max(...c.forecast);
  return Math.round(((peak - last) / last) * 100);
}

function bestForecastTick(crop) {
  const c = getCrop(crop);
  if (!c?.forecast?.length) return null;
  const peak = Math.max(...c.forecast);
  return { tick: c.forecast.indexOf(peak) + 1, price: peak };
}

export function getCropInsights(crop, qtyTons = 10) {
  const intel = getMarketIntelligence(crop);
  const opt = optimizeValueChain({ crop, qtyTons, isOrganic: true });
  if (!intel || !opt) return null;

  const trend = trendPct(crop);
  const peak = bestForecastTick(crop);
  const marginPct = Math.round((opt.addedValue / Math.max(1, opt.rawPath.net)) * 100);

  return {
    crop,
    insights: [
      {
        icon: "trending-up",
        title: "Market Timing",
        text: peak
          ? `Forecast peaks at $${peak.price.toLocaleString()}/ton in period F+${peak.tick} (${trend >= 0 ? "+" : ""}${trend}% vs today). ${trend > 8 ? "Consider holding processed inventory toward the peak." : "Spot pricing is near forecast — sell on completion."}`
          : "No forecast series available.",
      },
      {
        icon: "shield-alert",
        title: "Risk Watch",
        text: `Path B requires $${opt.processedPath.processingCost.toLocaleString()} upfront processing capital with ${intel.processor}. Lock the rate in a forward contract to cap exposure.`,
      },
      {
        icon: "handshake",
        title: "Negotiation Lever",
        text: `Your certified bonus is worth +$${intel.organicBonusPerTon}/ton. Lead with ${intel.certifications[0]} certification — it justifies the ${intel.processedProduct} premium tier and strengthens your position with ${intel.processor}.`,
      },
      {
        icon: "percent",
        title: "Margin Multiplier",
        text: `Local processing lifts net profit by ~${marginPct}% over the silo route for ${qtyTons} MT. Every additional quality grade adds 5–15% on top via the vision multiplier.`,
      },
    ],
  };
}

export function getPortfolioInsights(qtyTons = 10) {
  const rankings = [];

  for (const crop of Object.keys(getFabricGraph().crops)) {
    const opt = optimizeValueChain({ crop, qtyTons, isOrganic: true });
    if (!opt) continue;
    rankings.push({
      crop,
      addedValue: opt.addedValue,
      addedValuePerTon: Math.round(opt.addedValue / qtyTons),
      trendPct: trendPct(crop),
      processor: opt.processedPath.processor,
      processedProduct: opt.processedPath.processedProduct,
    });
  }

  rankings.sort((a, b) => b.addedValue - a.addedValue);

  const top = rankings[0];
  const rising = [...rankings].sort((a, b) => b.trendPct - a.trendPct)[0];

  const narrative = top
    ? `Across your ${qtyTons} MT scenario, **${top.crop}** delivers the strongest value-add at $${top.addedValue.toLocaleString()} (${top.processedProduct} via ${top.processor}). ` +
      `Momentum play: **${rising.crop}** shows the hottest forecast at +${rising.trendPct}%. ` +
      `Diversification across the top three routes hedges processing-capacity risk while keeping ~80% of the maximum margin.`
    : "No crops available for analysis.";

  return { qtyTons, rankings, narrative };
}

export function getAdvisorReply(message, context = {}) {
  const lower = message.toLowerCase();
  const crop = context.crop || "Olive Oil";
  const intel = getMarketIntelligence(crop);

  if (!intel) {
    return "I couldn't find market data for that crop. Try Olive Oil, Grapes, Wheat, Coffee, or Milk.";
  }

  if (lower.includes("matteo") || lower.includes("yield math") || lower.includes("processing cost")) {
    const opt = optimizeValueChain({ crop, qtyTons: context.qtyTons || 10, isOrganic: true });
    const trace = opt?.agentTrace;
    return `**Matteo:** I ran the Fabric IQ math for ${crop}. ${trace?.yieldMath?.yieldRule || "Standard processor conversion."} Estimated output: ${trace?.yieldMath?.output?.toLocaleString?.() || "—"} ${trace?.yieldMath?.unit || ""}. Processing plan cost: $${trace?.yieldMath?.processingCost?.toLocaleString?.() || intel.processingCostPerTon + "/ton"}.`;
  }

  if (lower.includes("sofia") || lower.includes("golden seal") || lower.includes("certification seal")) {
    const opt = optimizeValueChain({ crop, qtyTons: context.qtyTons || 10, isOrganic: true });
    const check = opt?.agentTrace?.compliance;
    return `**Sofia DOP:** I checked ${crop}. ${check?.metric || "Certification"} observed: ${check?.observed || "Verified"}; threshold: ${check?.threshold || "Premium evidence attached"}. ${check?.rule || intel.complianceRule} **Don Salvatore** may issue the Golden Certification Seal if the route remains profitable.`;
  }

  if (lower.includes("don salvatore") || lower.includes("orchestrate")) {
    return `**Don Salvatore:** I accept the farmer request for ${crop}. I delegate economics to **Matteo** and certification to **Sofia DOP**. If Matteo confirms positive value-add and Sofia confirms evidence, I issue the **Golden Certification Seal** and route the crop to ${intel.processor}.`;
  }

  if (lower.includes("contract") || lower.includes("fair-trade")) {
    return `**Don Salvatore:** I can issue the cooperative contract flow. I will ask **Matteo** to attach the yield math and **Sofia DOP** to attach the certification clause. Use **Export Contract** or ask Copilot: \`@agrivalue-iq generate_supply_contract crop="${crop}" qtyTons=10 isOrganic=true\`. Current route: ${intel.processor} at $${intel.processedPrice}/ton.`;
  }

  if (lower.includes("fabric") || lower.includes("price") || lower.includes("market")) {
    return `**Matteo:** Fabric IQ shows ${crop} at $${intel.rawPrice}/ton raw vs $${intel.processedPrice}/ton processed (${intel.processedProduct}). Best processor: ${intel.processor} in ${intel.processorLocation}. Organic bonus: +$${intel.organicBonusPerTon}/ton.`;
  }

  if (lower.includes("foundry") || lower.includes("compliance") || lower.includes("organic")) {
    return `**Sofia DOP:** Compliance for ${crop}: ${intel.complianceRule} Certifications: ${intel.certifications.join(", ")}. If evidence passes, Don Salvatore can issue the Golden Certification Seal.`;
  }

  if (lower.includes("work") || lower.includes("teams") || lower.includes("notify")) {
    return "**Work IQ** can push optimization results to your Microsoft Teams channel via Graph API. Enable GRAPH_* env vars and click **Notify Cooperative** after optimizing.";
  }

  if (lower.includes("path a") || lower.includes("silo")) {
    return `**Don Salvatore:** Path A means selling ${crop} raw at $${intel.rawPrice}/ton. I would only choose this if cash speed matters more than margin. Matteo estimates you miss roughly $${intel.processedPrice - intel.rawPrice}/ton of value-add opportunity.`;
  }

  if (lower.includes("path b") || lower.includes("process")) {
    return `**Don Salvatore:** Path B is our cooperative route. I send the crop to ${intel.processor}; **Matteo** models the processing economics, and **Sofia DOP** checks certification. Output: ${intel.processedProduct}. This is typically the higher-margin route for Sicilian smallholders.`;
  }

  return `**Don Salvatore:** I have your ${crop} request. I coordinate the cooperative: **Matteo** handles Fabric IQ yield math, **Sofia DOP** handles Foundry compliance, and I issue the Golden Certification Seal when the route qualifies. Ask me for Path A vs Path B, compliance, contracts, or the best route.`;
}
