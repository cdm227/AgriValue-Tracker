# Development with GitHub Copilot

This document describes how GitHub Copilot was used to build AgriValue Tracker for **Battle #1: Creative Apps** in the AI Agents League.

## How Copilot Accelerated Development

### 1. Backend scaffolding (`server.js`)

Copilot Chat was used to scaffold the Express API structure:

```
Create an Express API with routes for crop market data, quality evaluation,
and value-chain optimization. Use Azure Key Vault for secrets with env fallback.
```

Copilot generated the polling loop for Azure AI Foundry agent runs (`pollRun`), the thread/message/run API sequence, and telemetry logging patterns.

### 2. Fabric IQ semantic graph (`lib/fabric-iq.js`)

Copilot inline suggestions helped structure the crop → processor → certification ontology:

- **Entities:** crops, processors, compliance rules, organic bonuses
- **Relationships:** each processor `inputs` a crop; each crop has `certifications`
- **Reasoning:** `optimizeValueChain()` computes Path A vs Path B with quality multipliers

Prompt used in Copilot Chat:

```
Model a semantic market graph for Sicilian agriculture: 5 crops, local processors,
transport costs, DOP/DOC certifications, and Foundry compliance rules as separate
functions exportable to both Express and MCP.
```

### 3. MCP server for Copilot in VS Code (`mcp-server.js`)

Copilot helped implement the Model Context Protocol server exposing three tools:

| Tool                       | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `get_market_intelligence`  | Grounded pricing and compliance for a crop |
| `generate_supply_contract` | Draft Fair-Trade supply agreements         |
| `evaluate_crop_quality`    | Quality grade and profit multiplier        |

**Example Copilot Chat prompt (with MCP enabled):**

```
@agrivalue-iq generate_supply_contract crop="Olive Oil" qtyTons=15 isOrganic=true buyer="Cooperativa Valle del Belice"

Now customize section 4 for EU DOP export requirements and add a force majeure clause.
```

### 4. Frontend terminal UI (`public/index.html`)

Copilot assisted with:

- Tailwind layout for the "institutional terminal" aesthetic
- Chart.js market trend visualization wired to Fabric IQ forecast data
- Visual quality scanner animation and console log feed
- Contract export and "Copy for Copilot MCP" workflow buttons

### 5. Debugging with Copilot Chat

When the market chart threw `getElementById('trendChart')` errors, Copilot Chat identified the missing `<canvas>` element and suggested wrapping `initChart` in try/catch for static demo mode.

## MCP Setup in VS Code

1. Install [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) and enable MCP in settings
2. Open this repo in VS Code — `.vscode/mcp.json` registers the server automatically
3. Run `npm install` then verify: `npm run mcp` (should log "running on stdio")
4. In Copilot Chat, reference tools with `@agrivalue-iq`

## Suggested Copilot Workflows for Judges

### Write a contract from live optimization results

1. Run the app locally (`npm start`)
2. Optimize Olive Oil with organic certification
3. Click **Copy for Copilot MCP** in the results panel
4. Paste into Copilot Chat — MCP generates a grounded contract draft

### Extend the semantic graph

```
@agrivalue-iq get_market_intelligence crop="Grapes"

Add a new processor "Etna Volcanic Wines" in lib/fabric-iq.js with costs
and update the MCP enum in mcp-server.js
```

## What Was Built Manually vs. Copilot-Assisted

| Component                       | Copilot role                       |
| ------------------------------- | ---------------------------------- |
| Azure Foundry agent integration | Scaffolding + API version headers  |
| Fabric IQ ontology              | Data structure + helper functions  |
| MCP tool schemas                | JSON Schema definitions            |
| UI copy and styling             | Tailwind classes + animation CSS   |
| Security (Key Vault, .env)      | Pattern suggestions, manual review |
| Challenge documentation         | Structure outline, manual editing  |

## Security Note

Copilot was **not** given real API keys. All secrets use `.env` (gitignored) per the challenge security guidelines. See `.env.example` for required variables.
