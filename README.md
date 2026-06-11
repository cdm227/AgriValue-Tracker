# 🌾 AgriValue Tracker

**Battle #1: Creative Apps with GitHub Copilot** — AI Agents League

Sicilian agricultural value-chain optimizer powered by **Fabric IQ**, **Foundry IQ**, and **Work IQ** — with GitHub Copilot MCP contract generation.

## Intro Video

<video src="public/media/agrivalue-iq-intro.mp4" controls width="100%" poster="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"></video>

If your Markdown viewer does not render video, open:

[`public/media/agrivalue-iq-intro.mp4`](public/media/agrivalue-iq-intro.mp4)

## Live Demo

| Mode | URL |
|------|-----|
| GitHub Pages UI | [cdm227.github.io/AgriValue-Tracker](https://cdm227.github.io/AgriValue-Tracker) |
| Judge demo with intro video | […/demo.html](https://cdm227.github.io/AgriValue-Tracker/demo.html) |
| Full API (Azure) | Set `AZURE_API_URL` secret → see [docs/AZURE_DEPLOY.md](docs/AZURE_DEPLOY.md) |

## Quick Start

```bash
npm install
cp .env.example .env   # optional: Azure, Fabric, Graph credentials
npm start              # http://localhost:3000
npm run mcp            # Copilot MCP server for VS Code
```

### Test Locally Or In Codespaces

The app works with demo data out of the box. Users only need their own Microsoft resources if they want live integrations.

```bash
npm install
npm start
```

Then open:

- Local: `http://localhost:3000`
- Codespaces: open the forwarded `3000` port URL
- Static public preview: GitHub Pages uses client-side demo fallback when no Azure API URL is configured

Optional live integrations are configured by each user in their own `.env`:

```env
# Foundry IQ (optional)
FOUNDRY_OPENAI_BASE_URL=https://your-resource.services.ai.azure.com/openai/v1
FOUNDRY_MODEL_DEPLOYMENT=gpt-4o

# Fabric IQ (optional)
FABRIC_SQL_SERVER=your-workspace.datawarehouse.fabric.microsoft.com
FABRIC_SQL_DATABASE=AgriValueLakehouse

# Work IQ / Teams (optional)
TEAMS_WEBHOOK_URL=https://...
```

Do not commit `.env`.

## Agent Actions

The repo includes a project skill for Cursor agents:

`.agents/skills/agrivalue-iq-operator/SKILL.md`

Agents can run deterministic demo actions without browser automation:

```bash
npm run agent:action -- portfolio --qty 10
npm run agent:action -- optimize --crop "Olive Oil" --qty 15 --organic true --quality 1.15
npm run agent:action -- advisor --crop Grapes --message "What compliance rules matter?"
npm run agent:action -- contract --crop "Olive Oil" --qty 15 --buyer "Cooperativa Valle del Belice" --organic true
```

## Triple IQ Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Fabric IQ** | Fabric Lakehouse SQL + semantic graph | Market prices, processor network |
| **Foundry IQ** | Azure AI Foundry agent | Grounded compliance & bonuses |
| **Work IQ** | Microsoft Graph / Teams | Cooperative notifications |

## Challenge Requirements

| Requirement | Documentation |
|-------------|---------------|
| GitHub Copilot usage | [docs/COPILOT.md](docs/COPILOT.md) |
| Microsoft IQ (×3) | [docs/MICROSOFT_IQ.md](docs/MICROSOFT_IQ.md) |
| Azure deployment | [docs/AZURE_DEPLOY.md](docs/AZURE_DEPLOY.md) |
| 2-min demo video script | [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) |

## UI Features (v3)

- IQ status pills (Fabric / Foundry / Work)
- AI Harvest Advisor chat panel
- Interactive processor network map
- Vision quality scan → profit multiplier
- Typewriter Foundry compliance responses
- Export contract + Copilot MCP + Teams alert

## Project Structure

```
lib/
  fabric-iq.js          # In-memory ontology (fallback)
  fabric-lakehouse.js   # Microsoft Fabric SQL connector
  work-iq.js            # Microsoft Graph Teams
  iq-data.js            # Unified data layer
server.js               # Express API + IQ orchestration
mcp-server.js           # Copilot MCP tools
public/                 # Terminal UI + demo recorder
infra/                  # Bicep + Fabric SQL schema
.github/workflows/      # Azure + GitHub Pages deploy
```

## Record Your Demo Video

1. Open `/demo.html` → click **Start 2-Min Demo**
2. Open VS Code with Copilot MCP (`.vscode/mcp.json`)
3. Record screen — script in [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)



## Security

Secrets in `.env` only (gitignored). See `.env.example`.
