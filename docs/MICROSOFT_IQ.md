# Microsoft IQ Integration

AgriValue Tracker integrates **three Microsoft IQ intelligence layers**.

## Architecture

```
GitHub Pages UI ──► Azure App Service API
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   Fabric IQ        Foundry IQ        Work IQ
   Lakehouse SQL    Azure AI Agent    Microsoft Graph
   Semantic graph   RAG compliance    Teams notifications
         │               │               │
         └───────────────┴───────────────┘
                         │
                    mcp-server.js → GitHub Copilot in VS Code
```

## 1. Fabric IQ — Semantic Market Graph

**Implementation:** `lib/fabric-lakehouse.js` + `lib/iq-data.js`

| Mode | Source | When |
|------|--------|------|
| Live | Microsoft Fabric Warehouse SQL | `FABRIC_SQL_SERVER` configured |
| Fallback | In-memory ontology | Default / connection failure |

**Lakehouse setup:** Run `infra/fabric-schema.sql` in your Fabric SQL endpoint.

**Capabilities:**
- Crop → processor → certification relationships
- Price history and forecast series
- Value-chain optimization (Path A vs Path B)

## 2. Foundry IQ — Agentic Knowledge Retrieval

**Implementation:** `server.js` → `queryFoundryAgent()`

- Azure AI Foundry agent with knowledge files (FLO-CERT, USDA Organic, EU DOP)
- Grounded compliance responses with `$X/ton` bonus extraction
- Optional enrichment of AI Harvest Advisor chat

**Preferred env vars for newer Foundry projects (matches the Azure AI Foundry `OpenAI(.../openai/v1)` sample):**

```env
FOUNDRY_OPENAI_BASE_URL=https://your-resource.services.ai.azure.com/openai/v1
FOUNDRY_MODEL_DEPLOYMENT=gpt-4o
```

If `FOUNDRY_API_KEY` is omitted, the server uses `DefaultAzureCredential` with scope `https://ai.azure.com/.default`.

**Project agent Responses endpoint is also supported:**

```env
FOUNDRY_RESPONSES_ENDPOINT=https://your-resource.services.ai.azure.com/api/projects/your-project/agents/your-agent/endpoint/protocols/openai/responses
FOUNDRY_API_KEY=...
```

**Legacy Azure OpenAI Assistants-compatible fallback:**

```env
AZURE_AI_AGENT_ID=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=...
```

## 3. Work IQ — Microsoft Graph / Teams

**Implementation:** `lib/work-iq.js`

| Channel | Config |
|---------|--------|
| Microsoft Graph | `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `TEAMS_TEAM_ID`, `TEAMS_CHANNEL_ID` |
| Webhook fallback | `TEAMS_WEBHOOK_URL` |

**Triggers:**
- Auto on `/api/optimize` when Work IQ active
- Manual **Teams Alert** button in UI
- On contract export via `/api/generate-contract`

**Graph permission:** `ChannelMessage.Send` (application)

## MCP Bridge

`mcp-server.js` exposes IQ data to GitHub Copilot:
- `get_market_intelligence`
- `generate_supply_contract`
- `evaluate_crop_quality`

## Status Endpoint

`GET /api/status` returns live state of all three layers for UI pills and judges.

## Deployment

See [AZURE_DEPLOY.md](AZURE_DEPLOY.md) for GitHub Pages + Azure App Service setup.
