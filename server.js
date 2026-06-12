import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import {
  getCrop,
  evaluateQuality,
  optimizeValueChain,
  generateSupplyContract,
  getProcessorNetwork,
  getAdvisorReply,
  getCropInsights,
  getPortfolioInsights,
  syncFabricGraph,
  getFabricStatus,
} from './lib/iq-data.js';
import { getWorkIQStatus, notifyOptimizationComplete, notifyContractGenerated } from './lib/work-iq.js';
import { recordTrade, getTradeHistory } from './lib/agent-memory.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Azure App Service runs behind a proxy — needed for per-IP rate limits
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'https://cdm227.github.io,http://localhost:3000').split(',').map(s => s.trim());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sameRequestHost(source, req) {
  try {
    const sourceUrl = new URL(source);
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return sourceUrl.host === host;
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin, req) {
  if (!origin) return true;
  if (sameRequestHost(origin, req)) return true;
  return ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o.replace(/\/$/, '')));
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin, req)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Origin gate: reject browser API calls from foreign sites (CORS alone doesn't block the request server-side)
app.use('/api', (req, res, next) => {
  const source = req.headers.origin || req.headers.referer;
  if (source && !isAllowedOrigin(source, req)) {
    console.warn(`[SECURITY] Blocked foreign origin: ${source} → ${req.path}`);
    return res.status(403).json({ error: "Origin not allowed" });
  }
  next();
});

// Lightweight in-memory rate limiter (per IP, sliding window)
const rateBuckets = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = `${req.ip}:${windowMs}:${max}`;
    const now = Date.now();
    const hits = (rateBuckets.get(key) || []).filter(t => now - t < windowMs);
    if (hits.length >= max) {
      return res.status(429).json({ error: "Too many requests — slow down" });
    }
    hits.push(now);
    rateBuckets.set(key, hits);
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of rateBuckets) {
    const alive = hits.filter(t => now - t < 600000);
    if (alive.length === 0) rateBuckets.delete(key); else rateBuckets.set(key, alive);
  }
}, 60000).unref();

app.use('/api', rateLimit(60000, 60));                       // 60 req/min — all API
const expensiveLimit = rateLimit(300000, 15);                // 15 req/5min — Azure-backed routes

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const vaultName = process.env.KEYVAULT_NAME;
let secretClient = null;

if (vaultName) {
  const vaultUrl = `https://${vaultName}.vault.azure.net`;
  secretClient = new SecretClient(vaultUrl, new DefaultAzureCredential());
}

async function getSecureSecret(secretName) {
  if (secretClient) {
    try {
      const secret = await secretClient.getSecret(secretName);
      return secret.value;
    } catch {
      console.warn(`⚠️ Key Vault lookup failed for [${secretName}]`);
    }
  }
  return process.env[secretName.replace(/-/g, '_')];
}

async function getFoundryAuthHeaders(apiKey) {
  if (apiKey) return { "api-key": apiKey };

  const token = await new DefaultAzureCredential().getToken("https://ai.azure.com/.default");
  if (!token?.token) throw new Error("Unable to acquire Azure AI Foundry bearer token");
  return { Authorization: `Bearer ${token.token}` };
}

async function pollRun(threadId, runId, apiKey, endpoint) {
  const url = `${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=2024-02-15-preview`;
  while (true) {
    const res = await fetch(url, { headers: { 'api-key': apiKey } });
    const data = await res.json();
    if (data.status === 'completed') return data;
    if (data.status === 'failed' || data.status === 'cancelled') throw new Error(`Agent run: ${data.status}`);
    await new Promise(r => setTimeout(r, 1000));
  }
}

function parseFoundryText(data) {
  if (!data) return null;
  if (typeof data.output_text === "string") return data.output_text;
  if (typeof data.text === "string") return data.text;

  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") return part.text;
      if (typeof part.output_text === "string") return part.output_text;
    }
  }

  const choices = Array.isArray(data.choices) ? data.choices : [];
  return choices[0]?.message?.content ?? choices[0]?.text ?? null;
}

async function queryFoundryResponsesAgent({ crop, qtyTons, isOrganic }) {
  const baseUrl = process.env.FOUNDRY_OPENAI_BASE_URL?.replace(/\/$/, "");
  const endpoint = process.env.FOUNDRY_RESPONSES_ENDPOINT || (baseUrl ? `${baseUrl}/responses` : null);
  const model = process.env.FOUNDRY_MODEL_DEPLOYMENT || "gpt-4o";
  const apiKey = await getSecureSecret("FOUNDRY-API-KEY");
  if (!endpoint) return null;

  const prompt = [
    "You are AgriValue Advisor, a Microsoft Foundry agent for agricultural value-chain optimization.",
    `Farmer scenario: ${qtyTons} metric tons of ${crop}.`,
    `Certified organic/DOP/DOC flag: ${isOrganic}.`,
    "Use your grounded project knowledge and answer with:",
    "1. applicable compliance rule",
    "2. required evidence/documents",
    "3. premium bonus as $X/ton if eligible",
    "4. one concise recommendation for Path B processing.",
  ].join("\n");

  const headers = {
    "Content-Type": "application/json",
    ...(await getFoundryAuthHeaders(apiKey)),
  };

  const body = endpoint.includes("/openai/v1/")
    ? { model, input: prompt }
    : { input: prompt };

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Foundry Responses API ${res.status}: ${body.slice(0, 240)}`);
  }

  return parseFoundryText(await res.json());
}

async function queryFoundryAgent({ crop, qtyTons, isOrganic }) {
  const responsesReply = await queryFoundryResponsesAgent({ crop, qtyTons, isOrganic });
  if (responsesReply) return responsesReply;

  const azureApiKey = await getSecureSecret("AZURE-OPENAI-API-KEY");
  const agentId = process.env.AZURE_AI_AGENT_ID;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (!azureApiKey || !agentId || !endpoint) return null;

  const apiVersion = "2024-02-15-preview";
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
      content: `Farmer has ${qtyTons} tons of ${crop}. Organic certified: ${isOrganic}. Query knowledge files. Output compliance rule and premium bonus as $X/ton.`
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
  return msgs.data[0]?.content[0]?.text?.value ?? null;
}

function foundryConfigured() {
  return Boolean(
    process.env.FOUNDRY_RESPONSES_ENDPOINT ||
    process.env.FOUNDRY_OPENAI_BASE_URL ||
    (process.env.AZURE_AI_AGENT_ID && process.env.AZURE_OPENAI_ENDPOINT)
  );
}

app.get('/api/status', async (_req, res) => {
  const fabric = getFabricStatus();
  const work = getWorkIQStatus();
  res.json({
    fabricIQ: fabric,
    foundryIQ: { configured: foundryConfigured(), live: foundryConfigured() },
    workIQ: work,
    version: '3.0.0',
  });
});

app.get('/api/processors', (_req, res) => {
  res.json(getProcessorNetwork());
});

app.get('/api/crop/:name', (req, res) => {
  const crop = getCrop(req.params.name);
  if (!crop) return res.status(404).json({ error: "Crop not found" });
  res.json(crop);
});

app.post('/api/evaluate-quality', (req, res) => {
  const { crop } = req.body;
  if (!crop) return res.status(400).json({ error: "No crop specified" });
  res.json(evaluateQuality(crop));
});

app.post('/api/advisor', expensiveLimit, async (req, res) => {
  const { message, crop, language, stream, recentTrades } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const memory = Array.isArray(recentTrades) && recentTrades.length ? recentTrades : getTradeHistory(5);
  let reply = getAdvisorReply(message, { crop, language, recentTrades: memory });

  if (foundryConfigured() && message.length > 20) {
    try {
      const agentReply = await queryFoundryAgent({ crop: crop || 'Olive Oil', qtyTons: 10, isOrganic: true });
      if (agentReply) reply = `${reply}\n\n**Foundry IQ adds:** ${agentReply.slice(0, 500)}`;
    } catch { /* advisor falls back to rule-based */ }
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    const words = reply.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ token: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 30));
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  res.json({ reply });
});

app.get('/api/insights/portfolio', (req, res) => {
  const qtyTons = Number(req.query.qty) || 10;
  res.json(getPortfolioInsights(qtyTons));
});

app.get('/api/insights/:crop', (req, res) => {
  const qtyTons = Number(req.query.qty) || 10;
  const insights = getCropInsights(req.params.crop, qtyTons);
  if (!insights) return res.status(404).json({ error: "Crop not found" });
  res.json(insights);
});

app.post('/api/optimize', expensiveLimit, async (req, res) => {
  const { crop, qtyTons, isOrganic, qualityMultiplier = 1.0, notifyTeams } = req.body;
  if (!crop || !qtyTons) return res.status(400).json({ error: "Missing parameters" });

  console.log(`[IQ PIPELINE] ${crop} | ${qtyTons} MT | organic=${isOrganic} | quality=${qualityMultiplier}x`);

  let foundryRule = null;
  let bonusOverride = 0;

  try {
    const agentReply = await queryFoundryAgent({ crop, qtyTons, isOrganic });
    if (agentReply) {
      foundryRule = agentReply;
      const bonusMatch = agentReply.match(/\$?([0-9]+)\/ton/);
      if (bonusMatch) bonusOverride = parseInt(bonusMatch[1]) * qtyTons;
    }
  } catch (err) {
    console.warn("[FOUNDRY IQ]", err.message);
  }

  const result = optimizeValueChain({ crop, qtyTons, isOrganic, qualityMultiplier });

  if (foundryRule) {
    result.processedPath.foundryIQRule = foundryRule;
    if (bonusOverride > 0) {
      const prev = result.processedPath.organicBonus;
      result.processedPath.organicBonus = bonusOverride;
      result.processedPath.gross = result.processedPath.gross - prev + bonusOverride;
      result.processedPath.net = result.processedPath.gross - result.processedPath.processingCost - result.processedPath.transport;
      result.addedValue = Math.max(0, result.processedPath.net - result.rawPath.net);
    }
  }

  result.iqLayers = {
    fabric: getFabricStatus().source,
    foundry: foundryRule ? 'live-agent' : (foundryConfigured() ? 'fallback-rules' : 'local-rules'),
  };

  if (notifyTeams !== false && getWorkIQStatus().active) {
    result.workIQ = await notifyOptimizationComplete(result);
  }

  recordTrade({
    crop,
    qtyTons: Number(qtyTons),
    isOrganic: !!isOrganic,
    qualityMultiplier: Number(qualityMultiplier) || 1,
    addedValue: result.addedValue,
    pathBNet: result.processedPath?.net,
  });

  res.json(result);
});

app.get('/api/trade-history', (req, res) => {
  const limit = Number(req.query.limit) || 20;
  res.json({ trades: getTradeHistory(limit) });
});

app.post('/api/generate-contract', async (req, res) => {
  const { crop, qtyTons, buyer, isOrganic, notifyTeams } = req.body;
  if (!crop || !qtyTons) return res.status(400).json({ error: "Missing parameters" });

  const contract = generateSupplyContract({ crop, qtyTons, buyer, isOrganic });
  if (!contract) return res.status(404).json({ error: "Crop not found" });

  let workIQ = null;
  if (notifyTeams !== false && getWorkIQStatus().active) {
    workIQ = await notifyContractGenerated({ crop, qtyTons, buyer });
  }

  res.json({ contract, workIQ });
});

app.post('/api/notify-teams', async (req, res) => {
  const result = req.body;
  if (!result?.crop) return res.status(400).json({ error: "Optimization result required" });
  const workIQ = await notifyOptimizationComplete(result);
  res.json(workIQ);
});

app.post('/api/fabric/sync', rateLimit(300000, 3), async (_req, res) => {
  const sync = await syncFabricGraph(true);
  res.json(sync);
});

async function bootstrap() {
  await syncFabricGraph(true);
  app.listen(PORT, () => {
    console.log(`🛡️ AgriValue IQ server v3 — http://localhost:${PORT}`);
    console.log(`   Fabric: ${getFabricStatus().source} | Foundry: ${foundryConfigured() ? 'configured' : 'local'} | Work IQ: ${getWorkIQStatus().active ? 'active' : 'off'}`);
  });
}

bootstrap();
