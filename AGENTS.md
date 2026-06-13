# AgriValue Tracker — Agent Context

Sicilian value-chain optimizer for **Agents League Battle #1** (Creative Apps + GitHub Copilot MCP).

## Stack

| Layer        | Path                                                        | Role                                                        |
| ------------ | ----------------------------------------------------------- | ----------------------------------------------------------- |
| API          | `server.js`                                                 | Express routes, Foundry agent, IQ orchestration             |
| IQ data      | `lib/iq-data.js`                                            | Unified Fabric / portfolio / optimize / advisor             |
| Fabric graph | `lib/fabric-iq.js`, `lib/fabric-lakehouse.js`               | Semantic market graph (+ SQL fallback)                      |
| Work IQ      | `lib/work-iq.js`                                            | Microsoft Graph / Teams webhooks                            |
| MCP          | `mcp-server.js`, `.vscode/mcp.json`                         | Copilot tools in VS Code                                    |
| UI           | `public/index.html`, `public/demo.html`, `public/js/app.js` | Terminal + judge teleprompter                               |
| Static sync  | `scripts/sync-static-data.js`                               | Copies `lib/fabric-iq.js` → `public/js/fabric-iq-client.js` |

**Default branch:** `PROD`. **Live demo:** https://cdm227.github.io/AgriValue-Tracker/demo.html

## Commands

```bash
npm install
npm start                    # http://localhost:3000
npm run mcp                  # MCP server (stdio)
npm test                     # node:test suite
npm run lint                 # ESLint
npm run agent:action -- help # deterministic demo actions
npm run build:static         # Pages build (sync + config inject)
```

## Architecture & docs

- [docs/architecture.md](docs/architecture.md) — system overview
- [docs/MICROSOFT_IQ.md](docs/MICROSOFT_IQ.md) — Fabric / Foundry / Work IQ
- [docs/COPILOT.md](docs/COPILOT.md) — Copilot + MCP usage
- [docs/AZURE_DEPLOY.md](docs/AZURE_DEPLOY.md) — Azure App Service + Pages
- [.agents/skills/agrivalue-iq-operator/SKILL.md](.agents/skills/agrivalue-iq-operator/SKILL.md) — operator skill

## Conventions

- **ES modules** (`"type": "module"`) throughout; no CommonJS.
- **Secrets:** `.env` only (gitignored). Never commit keys. Use `.env.example` placeholders.
- **CORS:** restrict to GitHub Pages origin + localhost (see `server.js`).
- **IQ fallback:** app runs with in-memory Fabric graph when Azure/Fabric env vars are unset.
- **UI language:** English for all user-facing strings.
- **Minimal diffs:** match existing naming; extend `lib/iq-data.js` / `fabric-iq.js` rather than duplicating logic.
- **Generated files:** do not hand-edit `public/js/fabric-iq-client.js` or `public/config.js` — use scripts.

## MCP tools (`@agrivalue-iq`)

| Tool                       | Purpose                             |
| -------------------------- | ----------------------------------- |
| `get_market_intelligence`  | Crop pricing, processor, compliance |
| `generate_supply_contract` | Fair-Trade contract draft           |
| `evaluate_crop_quality`    | Vision grade + profit multiplier    |

## Do not

- Commit `.env`, publish profiles, or API keys.
- Add unrelated dependencies or large refactors during demo fixes.
- Break GitHub Pages static fallback (`public/mock-api.js`, `api-client.js` demo mode).

## Validation before PR

```bash
npm run lint && npm test && npm run build:static
```
