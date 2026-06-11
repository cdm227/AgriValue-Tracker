/**
 * Microsoft Fabric IQ — Lakehouse / Warehouse SQL connector.
 * Loads semantic market graph from Fabric when configured; falls back to in-memory graph.
 */
import sql from "mssql";
import { DefaultAzureCredential } from "@azure/identity";
import { fabricIQ as fallbackGraph, CROP_NAMES } from "./fabric-iq.js";

let activeGraph = null;
let dataSource = "in-memory";
let lastSync = null;
let syncError = null;

const SYNC_TTL_MS = 5 * 60 * 1000;

function isFabricConfigured() {
  return Boolean(
    process.env.FABRIC_SQL_SERVER &&
    process.env.FABRIC_SQL_DATABASE
  );
}

async function getSqlConfig() {
  const server = process.env.FABRIC_SQL_SERVER;
  const database = process.env.FABRIC_SQL_DATABASE;

  if (process.env.FABRIC_SQL_USER && process.env.FABRIC_SQL_PASSWORD) {
    return {
      server,
      database,
      user: process.env.FABRIC_SQL_USER,
      password: process.env.FABRIC_SQL_PASSWORD,
      options: { encrypt: true, trustServerCertificate: false },
    };
  }

  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("https://database.windows.net/.default");

  return {
    server,
    database,
    authentication: {
      type: "azure-active-directory-access-token",
      options: { token: token.token },
    },
    options: { encrypt: true, trustServerCertificate: false },
  };
}

function rowToCrop(name, rows) {
  const cropRows = rows.filter((r) => r.crop_name === name);
  if (!cropRows.length) return null;

  const latest = cropRows.find((r) => r.record_type === "current") ?? cropRows[0];
  const history = cropRows
    .filter((r) => r.record_type === "history")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => Number(r.price));
  const forecast = cropRows
    .filter((r) => r.record_type === "forecast")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => Number(r.price));

  return {
    basePrice: Number(latest.base_price),
    processedPrice: Number(latest.processed_price),
    processedName: latest.processed_name,
    region: latest.region,
    history: history.length ? history : fallbackGraph.crops[name]?.history ?? [],
    forecast: forecast.length ? forecast : fallbackGraph.crops[name]?.forecast ?? [],
    certifications: (latest.certifications || "").split("|").filter(Boolean),
  };
}

async function loadFromFabric() {
  const pool = await sql.connect(await getSqlConfig());

  const [cropResult, processorResult] = await Promise.all([
    pool.request().query(`
      SELECT crop_name, base_price, processed_price, processed_name, region,
             certifications, record_type, price, sort_order
      FROM dbo.agrivalue_crops
      ORDER BY crop_name, sort_order
    `),
    pool.request().query(`
      SELECT name, inputs, costs, location FROM dbo.agrivalue_processors
    `),
  ]);

  await pool.close();

  const crops = {};
  for (const name of CROP_NAMES) {
    const crop = rowToCrop(name, cropResult.recordset);
    if (crop) crops[name] = crop;
  }

  const processors = processorResult.recordset.map((r) => ({
    name: r.name,
    inputs: r.inputs,
    costs: Number(r.costs),
    location: r.location,
  }));

  if (!Object.keys(crops).length) {
    throw new Error("Fabric tables returned no crop data");
  }

  return {
    crops,
    processors: processors.length ? processors : fallbackGraph.processors,
    complianceRules: fallbackGraph.complianceRules,
    organicBonuses: fallbackGraph.organicBonuses,
  };
}

export async function syncFabricGraph(force = false) {
  if (!isFabricConfigured()) {
    activeGraph = fallbackGraph;
    dataSource = "in-memory";
    lastSync = new Date().toISOString();
    return { source: dataSource, crops: Object.keys(activeGraph.crops).length };
  }

  if (!force && activeGraph && lastSync && Date.now() - new Date(lastSync).getTime() < SYNC_TTL_MS) {
    return { source: dataSource, crops: Object.keys(activeGraph.crops).length, cached: true };
  }

  try {
    activeGraph = await loadFromFabric();
    dataSource = "microsoft-fabric";
    syncError = null;
    lastSync = new Date().toISOString();
    console.log(`[FABRIC IQ] Synced ${Object.keys(activeGraph.crops).length} crops from lakehouse`);
  } catch (err) {
    syncError = err.message;
    console.warn("[FABRIC IQ] Lakehouse sync failed, using fallback:", err.message);
    activeGraph = fallbackGraph;
    dataSource = "in-memory-fallback";
    lastSync = new Date().toISOString();
  }

  return {
    source: dataSource,
    crops: Object.keys(activeGraph.crops).length,
    error: syncError,
    lastSync,
  };
}

export function getFabricGraph() {
  return activeGraph ?? fallbackGraph;
}

export function getFabricStatus() {
  return {
    configured: isFabricConfigured(),
    source: dataSource,
    lastSync,
    error: syncError,
    server: process.env.FABRIC_SQL_SERVER ? "•••" + process.env.FABRIC_SQL_SERVER.slice(-20) : null,
  };
}
