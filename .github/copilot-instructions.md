# GitHub Copilot instructions — AgriValue Tracker

## Project

Sicilian agricultural value-chain terminal with **Fabric IQ**, **Foundry IQ**, **Work IQ**, and a custom **MCP server** (`agrivalue-iq`).

Read [AGENTS.md](../AGENTS.md) and [docs/architecture.md](../docs/architecture.md) before large changes.

## MCP

- Server: `mcp-server.js` — VS Code: `.vscode/mcp.json` · CLI: `.mcp.json`
- Invoke in Copilot Chat: `@agrivalue-iq get_market_intelligence crop="Olive Oil"`
- Copilot CLI: run `copilot` from repo root → `/mcp show agrivalue-iq` — see [docs/COPILOT_CLI.md](../docs/COPILOT_CLI.md)
- Tools: `get_market_intelligence`, `generate_supply_contract`, `evaluate_crop_quality`

## Code patterns

- Business logic lives in `lib/fabric-iq.js` and `lib/iq-data.js`; expose via `server.js` and MCP.
- Crop enum: `CROP_NAMES` in `lib/fabric-iq.js` — keep MCP JSON schema in sync.
- Frontend uses Tailwind CDN + `public/css/app.css`; demo teleprompter styles are inline in `demo.html`.

## Security

- Never suggest committing `.env` or real credentials.
- Use `.env.example` for documentation only.

## Tests

Run `npm test` after changing optimization, contracts, or IQ data. Tests live in `tests/`.
