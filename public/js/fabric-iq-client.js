/**
 * Fabric IQ Semantic Market Graph
 * Ontology-style crop → processor → certification relationships
 * for Sicilian agricultural value-chain reasoning.
 */

export const CROP_NAMES = ["Olive Oil", "Grapes", "Wheat", "Coffee", "Milk"];

export const fabricIQ = {
  crops: {
    "Olive Oil": {
      basePrice: 1200,
      processedPrice: 6800,
      processedName: "Extra Virgin Olive Oil DOP",
      region: "Val di Mazara, Sicily",
      history: [1100, 1150, 1180, 1220, 1200],
      forecast: [1250, 1300, 1380, 1450, 1550],
      certifications: ["EU DOP", "USDA Organic", "FLO-CERT-2026"],
    },
    Grapes: {
      basePrice: 850,
      processedPrice: 3200,
      processedName: "Premium Nero d'Avola DOC",
      region: "Noto, Sicily",
      history: [800, 820, 840, 830, 850],
      forecast: [880, 920, 960, 1010, 1080],
      certifications: ["DOC Sicilia", "Biodynamic"],
    },
    Wheat: {
      basePrice: 220,
      processedPrice: 380,
      processedName: "Premium Organic Semolina Flour",
      region: "Catania Plain, Sicily",
      history: [205, 210, 215, 208, 220],
      forecast: [225, 230, 242, 250, 265],
      certifications: ["USDA-ORGANIC-CLASS1", "EU Organic"],
    },
    Coffee: {
      basePrice: 3200,
      processedPrice: 5400,
      processedName: "Specialty Roasted Beans",
      region: "Etna Foothills, Sicily",
      history: [3000, 3100, 3150, 3120, 3200],
      forecast: [3300, 3450, 3600, 3800, 4000],
      certifications: ["FLO-CERT-2026", "Rainforest Alliance"],
    },
    Milk: {
      basePrice: 410,
      processedPrice: 2200,
      processedName: "Artisanal Aged Cheddar",
      region: "Madonie Highlands, Sicily",
      history: [390, 400, 395, 405, 410],
      forecast: [420, 440, 470, 500, 530],
      certifications: ["Grass-Fed Pasture", "EU PDO Cheese"],
    },
  },
  processors: [
    { name: "Frantoio Oleario Siciliano", inputs: "Olive Oil", costs: 350, location: "Palermo" },
    { name: "Cantina Nero d'Avola", inputs: "Grapes", costs: 250, location: "Noto" },
    { name: "Green Valley Mill", inputs: "Wheat", costs: 30, location: "Catania" },
    { name: "Artisanal Roasters Ltd", inputs: "Coffee", costs: 180, location: "Catania" },
    { name: "Highland Cheese Plant", inputs: "Milk", costs: 250, location: "Enna" },
  ],
  complianceRules: {
    "Olive Oil":
      "Must meet EU DOP Extra Virgin criteria: acidity ≤ 0.8%, peroxide ≤ 20 mEq/kg. Premium bonus: +$450/ton when USDA Organic certified.",
    Grapes:
      "DOC Sicilia appellation requires 85% Nero d'Avola varietal. Premium bonus: +$300/ton for biodynamic certification.",
    Wheat:
      "Must be milled in a certified organic facility (USDA-ORGANIC-CLASS1). Premium bonus: +$45/ton.",
    Coffee:
      "Ethically sourced under FLO-CERT-2026 Fair Trade guidelines. Premium bonus: +$250/ton.",
    Milk: "Pasture-raised grass-fed standards required for artisanal cheese route. Premium bonus: +$90/ton.",
  },
  organicBonuses: { "Olive Oil": 450, Grapes: 300, Wheat: 45, Coffee: 250, Milk: 90 },
};

export function getCrop(name) {
  return fabricIQ.crops[name] ?? null;
}

export function getProcessor(crop) {
  return fabricIQ.processors.find((p) => p.inputs === crop) ?? null;
}

export function getMarketIntelligence(crop) {
  const cropData = getCrop(crop);
  const processor = getProcessor(crop);
  if (!cropData || !processor) return null;

  const rule = fabricIQ.complianceRules[crop];
  const bonus = fabricIQ.organicBonuses[crop];

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

export function generateSupplyContract({ crop, qtyTons, buyer, isOrganic }) {
  const intel = getMarketIntelligence(crop);
  if (!intel) return null;

  const totalRaw = intel.rawPrice * qtyTons;
  const totalProcessed = intel.processedPrice * qtyTons;
  const bonus = isOrganic ? intel.organicBonusPerTon * qtyTons : 0;
  const date = new Date().toISOString().split("T")[0];

  return `# FAIR-TRADE SUPPLY AGREEMENT
**AgriValue Tracker — Fabric IQ Contract Generator**
Date: ${date}

## Parties
- **Seller:** ${buyer || "Sicilian Smallholder Cooperative"}
- **Buyer:** ${intel.processor} (${intel.processorLocation})

## Commodity
- **Crop:** ${crop} (${intel.region})
- **Quantity:** ${qtyTons} metric tons
- **Target Product:** ${intel.processedProduct}

## Pricing (Fabric IQ Semantic Graph)
| Route | Unit Price | Total |
|-------|-----------|-------|
| Raw commodity (Path A) | $${intel.rawPrice}/ton | $${totalRaw.toLocaleString()} |
| Value-added (Path B) | $${intel.processedPrice}/ton | $${totalProcessed.toLocaleString()} |
${isOrganic ? `| Organic certification bonus | +$${intel.organicBonusPerTon}/ton | +$${bonus.toLocaleString()} |` : ""}

## Compliance (Foundry IQ Grounded Rules)
${intel.complianceRule}

## Applicable Certifications
${intel.certifications.map((c) => `- ${c}`).join("\n")}

---
*Generated via AgriValue MCP — use with GitHub Copilot to customize terms.*`;
}

export function evaluateQuality(crop) {
  const profiles = {
    "Olive Oil": {
      grade: "Grade A+ (Premium Cold-Extraction)",
      analysis:
        "Acidity: 0.18% (Ultra-low), Peroxide: 3.2 mEq/kg, Color: Vibrant Emerald-Gold. Extra Virgin DOP criteria met.",
      multiplier: 1.15,
    },
    Grapes: {
      grade: "Grade A (DOC Appellation Class)",
      analysis:
        "Sugar: 22.4° Brix, Acid balance: High, Skin integrity: 98%. High-grade Nero d'Avola DOC potential.",
      multiplier: 1.1,
    },
    Wheat: {
      grade: "Grade A (Organic Premium)",
      analysis: "Moisture: 12.8%, Grain uniformity: 96%. Premium organic milling tier.",
      multiplier: 1.05,
    },
    Coffee: {
      grade: "Grade A+ (Specialty Single-Origin)",
      analysis: "Screen size: 18+, Defect count: 2/300g. Specialty roast classification.",
      multiplier: 1.12,
    },
    Milk: {
      grade: "Grade A (Grass-Fed Premium)",
      analysis: "Butterfat: 4.2%, Somatic cell count: 180k/mL. Artisanal cheese route eligible.",
      multiplier: 1.08,
    },
  };

  const profile = profiles[crop] ?? {
    grade: "Grade A (Standard Premium)",
    analysis: "Quality within premium tier parameters.",
    multiplier: 1.05,
  };

  return { crop, ...profile };
}

export function getYieldMath({ crop, qtyTons }) {
  if (crop === "Olive Oil") {
    const liters = qtyTons * 150;
    return {
      unit: "liters",
      output: liters,
      yieldRule: "15% oil yield: 1 ton olives = 150L oil",
      processingCost: 350 * qtyTons + 1.5 * liters,
      costBreakdown: [
        { label: "Pressing", value: 350 * qtyTons },
        { label: "Bottling", value: 1.5 * liters },
      ],
    };
  }

  if (crop === "Grapes") {
    const bottles = Math.round(qtyTons * 933);
    return {
      unit: "bottles",
      output: bottles,
      yieldRule: "70% wine yield: 1 ton grapes = 933 bottles",
      processingCost: 250 * qtyTons + 2 * bottles,
      costBreakdown: [
        { label: "Fermentation", value: 250 * qtyTons },
        { label: "Bottling", value: 2 * bottles },
      ],
    };
  }

  const processor = getProcessor(crop);
  return {
    unit: "processed tons",
    output: qtyTons,
    yieldRule: "Standard processor conversion",
    processingCost: (processor?.costs ?? 0) * qtyTons,
    costBreakdown: [{ label: "Processing", value: (processor?.costs ?? 0) * qtyTons }],
  };
}

export function getComplianceCheck({ crop, isOrganic }) {
  if (crop === "Olive Oil") {
    return {
      actor: "Sofia DOP",
      metric: "Acidity",
      threshold: "<= 0.3%",
      observed: "0.18%",
      passed: Boolean(isOrganic),
      rule: "Olives acidity <= 0.3% -> Olio DOP Sicilia (+$450/ton).",
    };
  }

  if (crop === "Grapes") {
    return {
      actor: "Sofia DOP",
      metric: "Sugar",
      threshold: ">= 21° Brix",
      observed: "22.4° Brix",
      passed: Boolean(isOrganic),
      rule: "Grapes sugar >= 21° Brix -> Nero d'Avola DOC (+$300/ton).",
    };
  }

  return {
    actor: "Sofia DOP",
    metric: "Certification",
    threshold: "Premium evidence attached",
    observed: isOrganic ? "Verified" : "Missing",
    passed: Boolean(isOrganic),
    rule: fabricIQ.complianceRules[crop],
  };
}

export function createAgentTrace({ crop, qtyTons, isOrganic, addedValue }) {
  const yieldMath = getYieldMath({ crop, qtyTons });
  const compliance = getComplianceCheck({ crop, isOrganic });
  const goldenSeal = compliance.passed && addedValue > 0;

  return {
    goldenSeal,
    yieldMath,
    compliance,
    actors: [
      {
        id: "don-salvatore",
        name: "Don Salvatore",
        role: "The Cooperative Coordinator",
        responsibility: "Orchestrator / Planner-Executor",
        action: `Intercepted farmer request for ${qtyTons} MT of ${crop}; delegated math to Matteo and compliance to Sofia DOP.`,
        status: goldenSeal ? "Golden Certification Seal issued" : "Awaiting qualification evidence",
      },
      {
        id: "matteo-logistics",
        name: "Matteo",
        role: "The Cooperative Planner",
        responsibility: "Fabric IQ / Yield Mathematics",
        action: `${yieldMath.yieldRule}. Estimated output: ${yieldMath.output.toLocaleString()} ${yieldMath.unit}.`,
        status: `Processing plan cost: $${yieldMath.processingCost.toLocaleString()}`,
      },
      {
        id: "sofia-dop",
        name: "Sofia DOP",
        role: "The Compliance Guardian",
        responsibility: "Grounded RAG / Foundry IQ",
        action: `${compliance.metric}: ${compliance.observed} against ${compliance.threshold}. ${compliance.rule}`,
        status: compliance.passed ? "Qualification passed" : "Certification evidence required",
      },
    ],
  };
}

export function optimizeValueChain({ crop, qtyTons, isOrganic, qualityMultiplier = 1.0 }) {
  const cropData = getCrop(crop);
  const processor = getProcessor(crop);
  if (!cropData || !processor) return null;

  const rawRev = cropData.basePrice * qtyTons;
  const rawTransport = 100;
  const rawNet = rawRev - rawTransport;

  const yieldMath = getYieldMath({ crop, qtyTons });
  const procCost = yieldMath.processingCost;
  let procRev = cropData.processedPrice * qtyTons * qualityMultiplier;

  const bonusPerTon = isOrganic ? fabricIQ.organicBonuses[crop] : 0;
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
      foundryIQRule: fabricIQ.complianceRules[crop],
      organicBonus: bonusApplied,
    },
    addedValue: netAddedValue,
    agentTrace,
  };
}
