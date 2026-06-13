/**
 * Unified IQ data layer — Fabric lakehouse with in-memory fallback.
 */
import { getFabricGraph } from "./fabric-lakehouse.js";
import { formatTradeMemoryReply } from "./agent-memory.js";
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

function detectAdvisorLanguage(message) {
  const text = message.toLowerCase();
  const italianMarkers = [
    "ciao",
    "grazie",
    "per favore",
    "quanto",
    "come",
    "posso",
    "guadagnare",
    "olive",
    "olio",
    "uva",
    "vino",
    "raccolto",
    "contadino",
    "certificazione",
    "contratto",
    "migliore",
    "prezzo",
    "qualita",
    "qualità",
    "sicilia",
  ];
  return italianMarkers.some((word) => text.includes(word)) ? "it" : "en";
}

function sicilianIntro(lang) {
  return lang === "it"
    ? "Ciao compare, Don Salvatore ti risponde nella lingua del raccolto."
    : "Ciao compare, Don Salvatore here.";
}

function advisorReply(lang, english, italian) {
  return lang === "it" ? `${sicilianIntro(lang)} ${italian}` : `${sicilianIntro(lang)} ${english}`;
}

export function getAdvisorReply(message, context = {}) {
  const lower = message.toLowerCase();
  const lang = context.language?.startsWith?.("it") ? "it" : detectAdvisorLanguage(message);
  const crop = context.crop || "Olive Oil";
  const intel = getMarketIntelligence(crop);

  if (!intel) {
    return lang === "it"
      ? "Mamma mia, non trovo dati per questa coltura. Prova Olive Oil, Grapes, Wheat, Coffee, o Milk."
      : "Mamma mia, I couldn't find market data for that crop. Try Olive Oil, Grapes, Wheat, Coffee, or Milk.";
  }

  if (
    lower.includes("matteo") ||
    lower.includes("yield math") ||
    lower.includes("processing cost") ||
    lower.includes("costo") ||
    lower.includes("conti") ||
    lower.includes("resa")
  ) {
    const opt = optimizeValueChain({ crop, qtyTons: context.qtyTons || 10, isOrganic: true });
    const trace = opt?.agentTrace;
    return advisorReply(
      lang,
      `**Matteo:** I ran the Fabric IQ math for ${crop}. ${trace?.yieldMath?.yieldRule || "Standard processor conversion."} Estimated output: ${trace?.yieldMath?.output?.toLocaleString?.() || "—"} ${trace?.yieldMath?.unit || ""}. Processing plan cost: $${trace?.yieldMath?.processingCost?.toLocaleString?.() || intel.processingCostPerTon + "/ton"}. Not bad, eh?`,
      `**Matteo:** Ho fatto i conti Fabric IQ per ${crop}. ${trace?.yieldMath?.yieldRule || "Conversione standard del trasformatore."} Produzione stimata: ${trace?.yieldMath?.output?.toLocaleString?.() || "—"} ${trace?.yieldMath?.unit || ""}. Costo del piano: $${trace?.yieldMath?.processingCost?.toLocaleString?.() || intel.processingCostPerTon + "/ton"}. Bello preciso, come un espresso.`
    );
  }

  if (
    lower.includes("sofia") ||
    lower.includes("golden seal") ||
    lower.includes("certification seal") ||
    lower.includes("sigillo") ||
    lower.includes("certificazione") ||
    lower.includes("qualita") ||
    lower.includes("qualità")
  ) {
    const opt = optimizeValueChain({ crop, qtyTons: context.qtyTons || 10, isOrganic: true });
    const check = opt?.agentTrace?.compliance;
    return advisorReply(
      lang,
      `**Sofia DOP:** I checked ${crop}. ${check?.metric || "Certification"} observed: ${check?.observed || "Verified"}; threshold: ${check?.threshold || "Premium evidence attached"}. ${check?.rule || intel.complianceRule} If the numbers stay strong, I let Don Salvatore stamp the Golden Seal.`,
      `**Sofia DOP:** Ho controllato ${crop}. ${check?.metric || "Certificazione"} osservata: ${check?.observed || "Verificata"}; soglia: ${check?.threshold || "Documenti premium allegati"}. ${check?.rule || intel.complianceRule} Se i numeri restano forti, Don Salvatore mette il Sigillo d'Oro.`
    );
  }

  if (lower.includes("don salvatore") || lower.includes("orchestrate")) {
    return advisorReply(
      lang,
      `**Don Salvatore:** I take the farmer request for ${crop}, capisce? **Matteo** checks the money, **Sofia DOP** checks the papers. If both say yes, boom: **Golden Certification Seal**, and we route to ${intel.processor}.`,
      `**Don Salvatore:** Prendo la richiesta per ${crop}, capisci? **Matteo** guarda i soldi, **Sofia DOP** guarda le carte. Se tutti dicono si, boom: **Sigillo d'Oro**, e mandiamo tutto a ${intel.processor}.`
    );
  }

  if (
    lower.includes("trade history") ||
    lower.includes("memory") ||
    lower.includes("storico") ||
    lower.includes("memoria") ||
    lower.includes("past trade") ||
    lower.includes("ultimi trade") ||
    lower.includes("ricord")
  ) {
    return formatTradeMemoryReply(context.recentTrades || [], lang);
  }

  if (
    lower.includes("vision") ||
    lower.includes("quality scan") ||
    lower.includes("neural") ||
    lower.includes("foto") ||
    lower.includes("photo") ||
    lower.includes("scan")
  ) {
    const vision = evaluateQuality(crop);
    return advisorReply(
      lang,
      `**Sofia DOP:** Foundry Vision grades ${crop} as **${vision.grade}** with a **${vision.multiplier}x** profit multiplier. ${vision.analysis} Upload a crop photo in the Vision Quality Scan panel — the multiplier flows straight into Path B math.`,
      `**Sofia DOP:** Foundry Vision classifica ${crop} come **${vision.grade}** con moltiplicatore **${vision.multiplier}x**. ${vision.analysis} Carica una foto nel pannello Vision Quality Scan — il moltiplicatore entra subito nei conti del Path B.`
    );
  }

  if (lower.includes("contract") || lower.includes("fair-trade") || lower.includes("contratto")) {
    return advisorReply(
      lang,
      `**Don Salvatore:** I can make the cooperative contract flow. **Matteo** brings the yield math, **Sofia DOP** brings the certification clause, and Copilot writes it nice. Use **Export Contract** or ask: \`@agrivalue-iq generate_supply_contract crop="${crop}" qtyTons=10 isOrganic=true\`. Current route: ${intel.processor} at $${intel.processedPrice}/ton.`,
      `**Don Salvatore:** Posso preparare il flusso del contratto cooperativo. **Matteo** porta i conti, **Sofia DOP** porta la clausola di certificazione, e Copilot lo scrive per bene. Usa **Export Contract** oppure chiedi: \`@agrivalue-iq generate_supply_contract crop="${crop}" qtyTons=10 isOrganic=true\`. Rotta attuale: ${intel.processor} a $${intel.processedPrice}/ton.`
    );
  }

  if (
    lower.includes("fabric") ||
    lower.includes("price") ||
    lower.includes("market") ||
    lower.includes("prezzo") ||
    lower.includes("mercato") ||
    lower.includes("guadagnare") ||
    lower.includes("migliore")
  ) {
    return advisorReply(
      lang,
      `**Matteo:** Fabric IQ shows ${crop}: $${intel.rawPrice}/ton raw, but $${intel.processedPrice}/ton after processing as ${intel.processedProduct}. Best processor: ${intel.processor} in ${intel.processorLocation}. Organic/DOP bonus: +$${intel.organicBonusPerTon}/ton. That is where the sauce is.`,
      `**Matteo:** Fabric IQ mostra ${crop}: $${intel.rawPrice}/ton grezzo, ma $${intel.processedPrice}/ton dopo la trasformazione in ${intel.processedProduct}. Miglior trasformatore: ${intel.processor} a ${intel.processorLocation}. Bonus organico/DOP: +$${intel.organicBonusPerTon}/ton. Qui sta il sugo.`
    );
  }

  if (
    lower.includes("foundry") ||
    lower.includes("compliance") ||
    lower.includes("organic") ||
    lower.includes("conformita") ||
    lower.includes("conformità") ||
    lower.includes("organico")
  ) {
    return advisorReply(
      lang,
      `**Sofia DOP:** Compliance for ${crop}: ${intel.complianceRule} Certifications: ${intel.certifications.join(", ")}. If evidence passes, Don Salvatore can issue the Golden Certification Seal.`,
      `**Sofia DOP:** Conformita per ${crop}: ${intel.complianceRule} Certificazioni: ${intel.certifications.join(", ")}. Se le prove passano, Don Salvatore puo emettere il Sigillo d'Oro.`
    );
  }

  if (
    lower.includes("work") ||
    lower.includes("teams") ||
    lower.includes("notify") ||
    lower.includes("notifica") ||
    lower.includes("avvisa")
  ) {
    return advisorReply(
      lang,
      "**Work IQ** can push optimization results to your Microsoft Teams channel via Graph API. Enable GRAPH_* env vars and click **Teams Alert** after optimizing.",
      "**Work IQ** puo inviare i risultati nel canale Microsoft Teams via Graph API. Configura le variabili GRAPH_* e clicca **Teams Alert** dopo l'ottimizzazione."
    );
  }

  if (lower.includes("path a") || lower.includes("silo") || lower.includes("grezzo")) {
    return advisorReply(
      lang,
      `**Don Salvatore:** Path A means selling ${crop} raw at $${intel.rawPrice}/ton. Fast cash, yes, but mamma mia, you leave value on the table. Matteo estimates roughly $${intel.processedPrice - intel.rawPrice}/ton of value-add opportunity before costs.`,
      `**Don Salvatore:** Path A vuol dire vendere ${crop} grezzo a $${intel.rawPrice}/ton. Soldi veloci, si, ma mamma mia, lasci valore sul tavolo. Matteo stima circa $${intel.processedPrice - intel.rawPrice}/ton di opportunita prima dei costi.`
    );
  }

  if (
    lower.includes("path b") ||
    lower.includes("process") ||
    lower.includes("trasforma") ||
    lower.includes("trasformazione")
  ) {
    return advisorReply(
      lang,
      `**Don Salvatore:** Path B is the cooperative route. We send ${crop} to ${intel.processor}; **Matteo** models the economics, **Sofia DOP** checks certification, and the output becomes ${intel.processedProduct}. Slower than the silo, but usually much richer.`,
      `**Don Salvatore:** Path B e la rotta cooperativa. Mandiamo ${crop} a ${intel.processor}; **Matteo** fa i conti, **Sofia DOP** controlla la certificazione, e il risultato diventa ${intel.processedProduct}. Piu lento del silo, ma di solito molto piu ricco.`
    );
  }

  return advisorReply(
    lang,
    `**Don Salvatore:** I have your ${crop} request. I coordinate the family business, but legal, eh: **Matteo** handles Fabric IQ yield math, **Sofia DOP** handles Foundry compliance, and I issue the Golden Certification Seal when the route qualifies. Ask me for Path A vs Path B, compliance, contracts, or the best route.`,
    `**Don Salvatore:** Ho la tua richiesta per ${crop}. Coordino la famiglia agricola, tutto legale eh: **Matteo** fa i conti Fabric IQ, **Sofia DOP** controlla la conformita Foundry, e io emetto il Sigillo d'Oro quando la rotta qualifica. Chiedimi Path A vs Path B, conformita, contratti, o la rotta migliore.`
  );
}
