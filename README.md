# 🌾 AgriValue Tracker

**Battle #1: Creative Apps with GitHub Copilot** — AI Agents League

Sicilian agricultural value-chain optimizer powered by **Fabric IQ**, **Foundry IQ**, and **Work IQ** — with GitHub Copilot MCP contract generation.

## Submission Demo Video (Agents League)

**2-min judge walkthrough:** [youtu.be/o8KqG8foLfM](https://youtu.be/o8KqG8foLfM)

Recorded from the live teleprompter at [demo.html](https://cdm227.github.io/AgriValue-Tracker/demo.html) (Fabric / Foundry / Vision / agent memory / Work IQ story).

## Intro Video (README)

<video src="public/media/agrivalue-iq-intro.mp4" controls width="100%" poster="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"></video>

If your Markdown viewer does not render video, open:

[`public/media/agrivalue-iq-intro.mp4`](public/media/agrivalue-iq-intro.mp4)

## Live Demo (for judges — start here)

| Mode                                                 | URL                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| GitHub Pages UI                                      | [cdm227.github.io/AgriValue-Tracker](https://cdm227.github.io/AgriValue-Tracker) |
| **2-min judge demo** (teleprompter + auto-narration) | […/demo.html](https://cdm227.github.io/AgriValue-Tracker/demo.html)              |
| Full API (Azure)                                     | Set `AZURE_API_URL` secret → see [docs/AZURE_DEPLOY.md](docs/AZURE_DEPLOY.md)    |

**Source branch:** **`PROD`** (default branch — clones and Pages stay in sync).

**CI:** Pushes to `PROD` auto-deploy GitHub Pages (`.github/workflows/static.yml`) and Azure backend (`.github/workflows/azure-deploy.yml` when Azure secrets are configured).

## Quick Start

```bash
npm install
cp .env.example .env   # optional: Azure, Fabric, Graph credentials
npm start              # http://localhost:3000
npm run mcp            # Copilot MCP server for VS Code
npm run verify:mcp     # smoke-test MCP (no CLI required)
npm test               # node:test suite (Fabric IQ + agent memory)
npm run lint           # ESLint
```

**AI / agent context:** [AGENTS.md](AGENTS.md) · [docs/architecture.md](docs/architecture.md) · [docs/COPILOT_CLI.md](docs/COPILOT_CLI.md) · [.github/copilot-instructions.md](.github/copilot-instructions.md)

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

| Layer          | Technology                            | Purpose                          |
| -------------- | ------------------------------------- | -------------------------------- |
| **Fabric IQ**  | Fabric Lakehouse SQL + semantic graph | Market prices, processor network |
| **Foundry IQ** | Azure AI Foundry agent                | Grounded compliance & bonuses    |
| **Work IQ**    | Microsoft Graph / Teams               | Cooperative notifications        |

## Challenge Requirements

| Requirement           | Status                                  | Documentation                                                                   |
| --------------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| GitHub Copilot + MCP  | Done                                    | [docs/COPILOT.md](docs/COPILOT.md) · [docs/COPILOT_CLI.md](docs/COPILOT_CLI.md) |
| Microsoft IQ (×3)     | Demo + docs                             | [docs/MICROSOFT_IQ.md](docs/MICROSOFT_IQ.md)                                    |
| Azure deployment      | Workflow ready                          | [docs/AZURE_DEPLOY.md](docs/AZURE_DEPLOY.md)                                    |
| Submission demo video | [YouTube](https://youtu.be/o8KqG8foLfM) | [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)                                      |

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
tests/                  # node:test — optimize, contracts, memory
server.js               # Express API + IQ orchestration
mcp-server.js           # Copilot MCP tools
public/                 # Terminal UI + demo recorder
infra/                  # Bicep + Fabric SQL schema
.github/workflows/      # CI, Azure + GitHub Pages deploy
AGENTS.md               # Canonical context for AI agents
docs/architecture.md    # System overview + ADRs
```

## Agents League Submission

| Item                                     | Link                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Demo video**                           | https://youtu.be/o8KqG8foLfM                                                                                             |
| **Live app**                             | https://cdm227.github.io/AgriValue-Tracker/demo.html                                                                     |
| **Register** (required for badge/prizes) | https://aka.ms/agentsleague/register                                                                                     |
| **Submit issue** (official)              | [microsoft/agentsleague — Project Submission](https://github.com/microsoft/agentsleague/issues/new?template=project.yml) |

Recording notes: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)

### Deploy & CI

| Trigger                        | Workflow                                                          | Result                                      |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------- |
| PR / push to `PROD`            | `ci.yml`                                                          | Lint, format check, tests, static build     |
| Push to `PROD`                 | `static.yml`                                                      | GitHub Pages deploy from `public/`          |
| Push to `PROD` (backend paths) | `azure-deploy.yml`                                                | Azure App Service deploy (requires secrets) |
| Manual                         | **Actions** → _Deploy static content to Pages_ → **Run workflow** | Redeploy Pages without a new commit         |

## Security

Secrets in `.env` only (gitignored). See `.env.example`.
