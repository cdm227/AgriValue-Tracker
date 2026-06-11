#!/usr/bin/env node
/**
 * AgriValue agent action runner.
 *
 * Gives Cursor/Copilot agents a deterministic way to interact with the app's
 * intelligence layer without browser automation.
 */
import {
  getAdvisorReply,
  getCropInsights,
  getPortfolioInsights,
  optimizeValueChain,
  generateSupplyContract,
  syncFabricGraph,
} from "../lib/iq-data.js";

const args = process.argv.slice(2);
const command = args[0] || "help";

function readFlag(name, fallback = undefined) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? true;
}

function readBool(name, fallback = false) {
  const value = readFlag(name, fallback ? "true" : "false");
  return value === true || value === "true" || value === "1" || value === "yes";
}

function print(value) {
  if (typeof value === "string") {
    console.log(value);
    return;
  }
  console.log(JSON.stringify(value, null, 2));
}

function help() {
  print(`AgriValue Agent Action Runner

Usage:
  npm run agent:action -- portfolio --qty 10
  npm run agent:action -- optimize --crop "Olive Oil" --qty 15 --organic true --quality 1.15
  npm run agent:action -- advisor --crop Grapes --message "What compliance rules matter?"
  npm run agent:action -- insights --crop Coffee --qty 12
  npm run agent:action -- contract --crop "Olive Oil" --qty 15 --buyer "Cooperativa Valle del Belice" --organic true

Commands:
  portfolio  Rank all crops by added value and forecast momentum
  optimize   Compare Path A silo vs Path B local processing
  advisor    Ask the rule-based AI Harvest Advisor
  insights   Generate four AI intelligence cards for one crop
  contract   Generate a Fair-Trade supply agreement draft
`);
}

await syncFabricGraph(true);

switch (command) {
  case "portfolio": {
    const qtyTons = Number(readFlag("qty", 10));
    print(getPortfolioInsights(qtyTons));
    break;
  }
  case "optimize": {
    const crop = readFlag("crop", "Olive Oil");
    const qtyTons = Number(readFlag("qty", 10));
    const isOrganic = readBool("organic", true);
    const qualityMultiplier = Number(readFlag("quality", 1));
    print(optimizeValueChain({ crop, qtyTons, isOrganic, qualityMultiplier }));
    break;
  }
  case "advisor": {
    const crop = readFlag("crop", "Olive Oil");
    const message = readFlag("message", "What is the best route?");
    print(getAdvisorReply(message, { crop }));
    break;
  }
  case "insights": {
    const crop = readFlag("crop", "Olive Oil");
    const qtyTons = Number(readFlag("qty", 10));
    print(getCropInsights(crop, qtyTons));
    break;
  }
  case "contract": {
    const crop = readFlag("crop", "Olive Oil");
    const qtyTons = Number(readFlag("qty", 10));
    const buyer = readFlag("buyer", "Sicilian Smallholder Cooperative");
    const isOrganic = readBool("organic", true);
    print(generateSupplyContract({ crop, qtyTons, buyer, isOrganic }));
    break;
  }
  default:
    help();
}
