# ADR 001: Triple Microsoft IQ stack

## Status

Accepted — Agents League submission (Battle #1).

## Context

AgriValue must show meaningful use of Microsoft intelligence platforms while remaining demoable without every judge configuring Azure resources.

## Decision

Integrate three layers with graceful fallback:

1. **Fabric IQ** — semantic market graph; live Fabric SQL when configured, in-memory ontology otherwise.
2. **Foundry IQ** — compliance and advisor enrichment via Azure AI Foundry when configured; grounded rules in `fabric-iq.js` otherwise.
3. **Work IQ** — Teams notifications via Microsoft Graph or incoming webhook when configured; UI shows offline status otherwise.

Expose the same domain logic to **GitHub Copilot MCP** (`mcp-server.js`) so contracts and market data stay consistent across UI and IDE.

## Consequences

- Judges can use GitHub Pages immediately; optional Azure unlocks live IQ pills.
- Single source of truth in `lib/iq-data.js` / `lib/fabric-iq.js` shared by API and MCP.
- `.env` holds all secrets; no credentials in the repo.
