import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 🛡️ Crash-Proof Azure Key Vault ---
let secretClient = null;
const vaultName = process.env.KEYVAULT_NAME;

if (vaultName && vaultName !== "agrivalue-secure-vault") {
  try {
    const vaultUrl = `https://${vaultName}.vault.azure.net`;
    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(vaultUrl, credential);
  } catch (err) {
    console.warn("⚠️ Azure Key Vault startup authentication failed.");
  }
}

async function getSecureSecret(secretName) {
  if (!secretClient) return process.env[secretName.replace(/-/g, '_')];
  try {
    const secret = await secretClient.getSecret(secretName);
    return secret.value;
  } catch (err) {
    return process.env[secretName.replace(/-/g, '_')];
  }
}

// REAL-WORLD SICILIAN SPECIFICATIONS (MatteoLogistics & SofiaDOP)
const sicilianSpecs = {
  "Olive Oil": {
    rawPricePerTon: 1200,
    processedPricePerLiter: 18,
    yieldPercent: 0.15,
    millingCostPerTon: 350,
    bottlingCostPerLiter: 1.50,
    certificationFlatFee: 150
  },
  "Grapes": {
    rawPricePerTon: 850,
    processedPricePerBottle: 6.50,
    yieldPercent: 0.70,
    crushingCostPerTon: 250,
    bottlingCostPerBottle: 2.00,
    certificationFlatFee: 200
  }
};

// API: Value-Chain Optimization representing the Collaborative Agents
app.post('/api/optimize', async (req, res) => {
  const { crop, qtyTons, qualityMetric, isOrganic } = req.body;
  if (!crop || !qtyTons) return res.status(400).json({ error: "Missing parameters" });

  const spec = sicilianSpecs[crop];
  const logs = [];

  // Don Salvatore (Coordinator) Intercepts
  logs.push({ agent: "Don Salvatore (Coordinator)", text: `[1] Intercepted cargo: ${qtyTons} tons of ${crop}. Quality metric: ${qualityMetric}. Delegating audits...` });

  // Sofia (DOP Scribe) Checks Compliance
  logs.push({ agent: "Sofia (Scribe Agent)", text: `[2] Auditing agronomical parameters against DOP/DOC Sicilia guidelines...` });
  
  let foundryRule = "";
  let bonusApplied = 0;

  if (crop === "Olive Oil") {
    if (parseFloat(qualityMetric) <= 0.3) {
      bonusApplied = 450;
      foundryRule = "✓ SUCCESS: Acidity verified at " + qualityMetric + "% (<= 0.3% threshold). Unlocked Olio DOP Sicilia extra premium bonus of +$450/ton.";
    } else {
      foundryRule = "❌ FAILED: Acidity is " + qualityMetric + "% (exceeds 0.3% limit). Crop fails to qualify for Olio DOP Sicilia. Selling at raw base rates.";
    }
  } else if (crop === "Grapes") {
    if (parseFloat(qualityMetric) >= 21.0) {
      bonusApplied = 300;
      foundryRule = "✓ SUCCESS: Sugar level verified at " + qualityMetric + " Brix (>= 21 Brix limit). Unlocked Nero d'Avola DOC Sicilia appellation premium of +$300/ton.";
    } else {
      foundryRule = "❌ FAILED: Sugar density is " + qualityMetric + " Brix (below 21 Brix limit). Crop fails to qualify for DOC appellation.";
    }
  }

  // Matteo (Logistics) Calculates Conversions
  logs.push({ agent: "Matteo (Logistics Agent)", text: `[3] Computing physical yields and cooperative cost ledgers...` });
  
  const rawGross = spec.rawPricePerTon * qtyTons;
  const rawTransport = 100;
  const rawNet = rawGross - rawTransport;

  const millingCost = spec.millingCostPerTon * qtyTons;
  let yieldAmount = qtyTons * 1000 * spec.yieldPercent;
  let yieldUnit = "Liters of Oil";

  if (crop === "Grapes") {
    yieldAmount = Math.floor(yieldAmount / 0.75); // Bottles
    yieldUnit = "Bottles of Wine";
  }

  const packagingCost = (crop === "Olive Oil" ? spec.bottlingCostPerLiter : spec.bottlingCostPerBottle) * yieldAmount;
  let processedGross = yieldAmount * (crop === "Olive Oil" ? spec.processedPricePerLiter : spec.processedPricePerBottle);
  
  const qualityBonus = bonusApplied * qtyTons;
  processedGross += qualityBonus;

  const totalProcCost = millingCost + packagingCost + spec.certificationFlatFee;
  const procTransport = 150;
  const procNet = processedGross - totalProcCost - procTransport;
  const netAddedValue = Math.max(0, procNet - rawNet);

  logs.push({ agent: "Don Salvatore (Coordinator)", text: `[4] Analysis complete! Compiling final cooperative trade agreement contract.` });

  res.json({
    crop,
    qtyTons,
    yieldAmount,
    yieldUnit,
    rawPath: { gross: rawGross, transport: rawTransport, net: rawNet },
    processedPath: {
      gross: processedGross,
      milling: millingCost,
      packaging: packagingCost,
      flatFee: spec.certificationFlatFee,
      totalCost: totalProcCost,
      transport: procTransport,
      net: procNet,
      qualityBonus,
      foundryIQRule: foundryRule
    },
    addedValue: netAddedValue,
    logs
  });
});

// API: Live Chatbot Advisor
app.post('/api/chat', async (req, res) => {
  const { message, crop } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  let reply = "The Sicilian Agricultural cooperative welcomes your query. Please ask specifically about Olio DOP or Nero d'Avola grape pressing standards.";

  const azureApiKey = await getSecureSecret("AZURE-OPENAI-API-KEY");
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (azureApiKey && endpoint) {
    try {
      const url = `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o'}/chat/completions?api-version=2024-02-15-preview`;
      const aiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': azureApiKey },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are Don Salvatore, a Sicilian agricultural expert. Give advice on how to improve crop quality (e.g. lowering acidity below 0.3% for Olive Oil, or aiming for 21 Brix sugar for Wine grapes), how to certified for DOP Sicilia / DOC wine, and how cooperative milling at Frantoi/Cantine increases profit margins." },
            { role: "user", content: `Query Context: Crop is ${crop}. Farmer asks: ${message}` }
          ],
          max_tokens: 250,
          temperature: 0.2
        })
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        reply = aiData.choices[0].message.content;
      }
    } catch (err) {
      console.warn("⚠️ Chatbot API failed, utilizing fallback response.");
    }
  } else {
    if (crop === "Olive Oil") {
      reply = "To qualify for the DOP Sicilia certification, your olive acidity must remain below 0.3%. Ensure you transport your harvest to the Frantoio Oleario within 8 hours of picking, and enforce a cold-milling temperature strictly below 27°C. This will increase your oil valuation by +$450/ton.";
    } else if (crop === "Grapes") {
      reply = "To produce Nero d'Avola DOC Sicilia wine, aim for a grape sugar content of at least 21° Brix during harvesting. Ensure slow maceration and Oak aging at the Cantina. This qualifies your wine for DOC appellation labeling, adding a premium bonus of +$300/ton.";
    }
  }

  res.json({ reply });
});

app.listen(PORT, () => {
  console.log(`🛡️ Nero's Vineyard server running on http://localhost:${PORT}`);
});
