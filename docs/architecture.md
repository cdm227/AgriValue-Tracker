# Architecture

AgriValue Tracker connects a static GitHub Pages UI to an optional Azure Node.js API, with three Microsoft IQ layers and a Copilot MCP bridge.

## System context

```
                    ┌─────────────────────────────────────┐
                    │  GitHub Copilot (VS Code + MCP)      │
                    │  mcp-server.js → lib/iq-data.js      │
                    └──────────────────┬──────────────────┘
                                       │
┌──────────────┐    config.js         │         ┌─────────────────────┐
│ GitHub Pages │ ──fetch──────────────┼────────►│ Azure App Service    │
│ public/      │                      │         │ server.js            │
└──────────────┘                      │         └──────────┬──────────┘
       │                              │                    │
       │ static fallback            │         ┌──────────┼──────────┐
       └ mock-api / fabric-iq-client │         ▼          ▼          ▼
                                     │    Fabric IQ  Foundry IQ  Work IQ
                                     │    (SQL/mem)  (Foundry)   (Graph)
                                     └────────────────────────────────
```

## Layers

| Layer        | Module                                        | Responsibility                            |
| ------------ | --------------------------------------------- | ----------------------------------------- |
| Presentation | `public/index.html`, `public/js/app.js`       | Terminal UI, charts, advisor, vision scan |
| Judge demo   | `public/demo.html`                            | 2-min teleprompter + embedded live app    |
| API          | `server.js`                                   | REST routes, CORS, Foundry agent polling  |
| Domain       | `lib/iq-data.js`                              | Portfolio, optimize, advisor, contracts   |
| Fabric IQ    | `lib/fabric-iq.js`, `lib/fabric-lakehouse.js` | Crop → processor graph, Path A vs B       |
| Agent memory | `lib/agent-memory.js`                         | In-session trade history                  |
| Work IQ      | `lib/work-iq.js`                              | Teams via Graph or webhook                |
| MCP          | `mcp-server.js`                               | Copilot tool surface                      |

## Key flows

### Value-chain optimization

1. UI or `/api/optimize` receives crop, qty, organic flag, quality multiplier.
2. `optimizeValueChain()` in `lib/iq-data.js` computes Path A (silo) vs Path B (local processing).
3. `createAgentTrace()` attaches Don Salvatore / Matteo / Sofia narrative.
4. `recordTrade()` saves to agent memory; Work IQ may notify Teams.

### Static demo mode (Pages)

When `public/config.js` has `staticFallback: true`, the browser uses `public/mock-api.js` and synced `fabric-iq-client.js` — no Azure required.

## Deployment

| Target           | Trigger                        | Workflow                             |
| ---------------- | ------------------------------ | ------------------------------------ |
| GitHub Pages     | Push to `PROD`                 | `.github/workflows/static.yml`       |
| Azure API        | Push to `PROD` (backend paths) | `.github/workflows/azure-deploy.yml` |
| CI (lint + test) | PR / push to `PROD`            | `.github/workflows/ci.yml`           |

## Related docs

- [MICROSOFT_IQ.md](MICROSOFT_IQ.md) — IQ integration detail
- [AZURE_DEPLOY.md](AZURE_DEPLOY.md) — provisioning and env vars
- [COPILOT.md](COPILOT.md) — Copilot development story
- [adr/001-triple-iq-stack.md](adr/001-triple-iq-stack.md) — ADR: why three IQ layers
