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

const vaultName = process.env.KEYVAULT_NAME;
const vaultUrl = `https://${vaultName}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(vaultUrl, credential);

async function getSecureSecret(secretName) {
  try {
    const secret = await secretClient.getSecret(secretName);
    return secret.value;
  } catch (err) {
    console.warn(`⚠️ Key Vault lookup failed for secret [${secretName}]. Falling back to local env.`);
    return process.env[secretName.replace(/-/g, '_')];
  }
}

// PREMIUM SICILIAN CROP DATABASE (Fabric IQ)
const mockFabricIQ = {
  crops: {
    "Olive Oil": { basePrice: 1200, processedPrice: 6800, processedName: "Extra Virgin Olive Oil DOP", history: [1100, 1150, 1180, 1220, 1200], forecast: [1250, 1300, 1380, 1450, 1550] },
    "Grapes": { basePrice: 850, processedPrice: 3200, processedName: "Premium Nero d'Avola DOC", history: [800, 820, 840, 830, 850], forecast: [880, 920, 960, 1010, 1080] },
    "Wheat": { basePrice: 220, processedPrice: 380, processedName: "Premium Organic Semolina Flour", history: [205, 210, 215, 208, 220], forecast: [225, 230, 242, 250, 265] },
    "Coffee": { basePrice: 3200, processedPrice: 5400, processedName: "Specialty Roasted Beans", history: [3000, 3100, 3150, 3120, 3200], forecast: [3300, 3450, 3600, 3800, 4000] },
    "Milk": { basePrice: 410, processedPrice: 2200, processedName: "Artisanal Aged Cheddar", history: [390, 400, 395, 405, 410], forecast: [420, 440, 470, 500, 530] }
  },
  processors: [
    { name: "Frantoio Oleario Siciliano", inputs: "Olive Oil", costs: 350 },
    { name: "Cantina Nero d'Avola", inputs: "Grapes", costs: 250 },
    { name: "Green Valley Mill", inputs: "Wheat", costs: 30 },
    { name: "Artisanal Roasters Ltd", inputs: "Coffee", costs: 180 },
    { name: "Highland Cheese Plant", inputs: "Milk", costs: 250 }
  ]
};

app.get('/api/crop/:name', (req, res) => {
  const crop = mockFabricIQ.crops[req.params.name];
  if (!crop) return res.status(404).json({ error: "Crop not found" });
  res.json(crop);
});

async function pollRun(threadId, runId, apiKey, endpoint) {
  const url = `${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=2024-02-15-preview`;
  while (true) {
    const res = await fetch(url, { headers: { 'api-key': apiKey } });
    const data = await res.json();
    if (data.status === 'completed') return data;
    if (data.status === 'failed' || data.status === 'cancelled') throw new Error(`Agent run: ${data.status}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// API: Visual Crop Quality Evaluator (Simulation)
app.post('/api/evaluate-quality', (req, res) => {
  const { crop } = req.body;
  if (!crop) return res.status(400).json({ error: "No crop specified" });

  let qualityGrade = "Grade B (Standard)";
  let analysisText = "";
  let bonusMultiplier = 1.0;

  if (crop === "Olive Oil") {
    qualityGrade = "Grade A+ (Premium Cold-Extraction)";
    analysisText = "Acidity: 0.18% (Ultra-low, excellent), Peroxide: 3.2 mEq/kg (High purity), Color: Vibrant Emerald-Gold. Classification: Extra Virgin Olive Oil DOP criteria met.";
    bonusMultiplier = 1.15;
  } else if (crop === "Grapes") {
    qualityGrade = "Grade A (DOC Appellation Class)";
    analysisText = "Sugar Content: 22.4° Brix (Perfect for fermentation), Acid Balance: High, Skin integrity: 98% undamaged. Classification: High-grade Nero d'Avola DOC wine potential.";
    bonusMultiplier = 1.10;
  } else {
    qualityGrade = "Grade A (Standard Premium)";
    analysisText = "Moisture Level: 12.8% (Highly stable), Grain Uniformity: 96%. Classification: Premium tier.";
    bonusMultiplier = 1.05;
  }

  res.json({
    crop,
    grade: qualityGrade,
    analysis: analysisText,
    multiplier: bonusMultiplier
  });
});

// API: Secured Value Chain Optimization with Telemetry Logging
app.post('/api/optimize', async (req, res) => {
  const { crop, qtyTons, isOrganic } = req.body;
  if (!crop || !qtyTons) return res.status(400).json({ error: "Missing parameters" });

  const cropData = mockFabricIQ.crops[crop];
  const processor = mockFabricIQ.processors.find(p => p.inputs === crop);

  let foundryRule = "Verified Organic/Fair-Trade guidelines.";
  let bonusApplied = 0;

  const azureApiKey = await getSecureSecret("AZURE-OPENAI-API-KEY");
  const agentId = process.env.AZURE_AI_AGENT_ID;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  // --- TELEMETRY LOG FOR FOUNDRY TRACES ---
  console.log(`[FOUNDRY TRACE] ${new Date().toISOString()} - Optimizing Crop: ${crop} | Qty: ${qtyTons} Tons | Organic: ${isOrganic}`);

  if (azureApiKey && agentId && endpoint) {
    try {
      const apiVersion = "2024-02-15-preview";
      console.log(`[FOUNDRY TRACE] Initiating session run for Agent ID: ${agentId}`);

      const threadRes = await fetch(`${endpoint}/openai/threads?api-version=${apiVersion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': azureApiKey }
      });
      const thread = await threadRes.json();

      await fetch(`${endpoint}/openai/threads/${thread.id}/messages?api-version=${apiVersion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': azureApiKey },
        body: JSON.stringify({
          role: "user",
          content: `Farmer has ${qtyTons} tons of ${crop}. Is Organic check: ${isOrganic}. Query your knowledge files and output compliance rule and premium bonus.`
        })
      });

      const runRes = await fetch(`${endpoint}/openai/threads/${thread.id}/runs?api-version=${apiVersion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': azureApiKey },
        body: JSON.stringify({ assistant_id: agentId })
      });
      const run = await runRes.json();

      await pollRun(thread.id, run.id, azureApiKey, endpoint);

      const msgRes = await fetch(`${endpoint}/openai/threads/${thread.id}/messages?api-version=${apiVersion}`, {
        headers: { 'api-key': azureApiKey }
      });
      const msgs = await msgRes.json();
      
      const agentReply = msgs.data[0]?.content[0]?.text?.value;
      if (agentReply) {
        foundryRule = agentReply;
        const bonusMatch = agentReply.match(/\$?([0-9]+)\/ton/);
        bonusApplied = bonusMatch ? parseInt(bonusMatch[1]) : (isOrganic ? 90 : 0);
      }
      
      console.log(`[FOUNDRY TRACE] Run Completed Successfully. Reply Grounded: ${!!agentReply}`);

    } catch (err) {
      console.warn("[FOUNDRY TRACE] Error connecting to live agent:", err.message);
    }
  }

  const rawRev = cropData.basePrice * qtyTons;
  const rawTransport = 100;
  const rawNet = rawRev - rawTransport;

  const procCost = processor.costs * qtyTons;
  let procRev = cropData.processedPrice * qtyTons;
  
  if (bonusApplied === 0 && isOrganic) {
    const organicBonuses = { "Olive Oil": 450, "Grapes": 300, "Wheat": 45, "Coffee": 250, "Milk": 90 };
    bonusApplied = organicBonuses[crop] * qtyTons;
  } else {
    bonusApplied = bonusApplied * qtyTons;
  }
  procRev += bonusApplied;

  const procTransport = 150;
  const procNet = procRev - procCost - procTransport;
  const netAddedValue = Math.max(0, procNet - rawNet);

  res.json({
    crop,
    qtyTons,
    isOrganic,
    rawPath: { gross: rawRev, transport: rawTransport, net: rawNet },
    processedPath: {
      processor: processor.name,
      processedProduct: cropData.processedName,
      gross: procRev,
      processingCost: procCost,
      transport: procTransport,
      net: procNet,
      foundryIQRule: foundryRule,
      organicBonus: bonusApplied
    },
    addedValue: netAddedValue
  });
});

app.listen(PORT, () => {
  console.log(`🛡️ Enterprise-secured AgriValue server running on http://localhost:${PORT}`);
});
