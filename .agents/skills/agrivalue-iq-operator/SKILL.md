---
name: agrivalue-iq-operator
description: Operates AgriValue Tracker as an interactive AI agent workflow. Use when testing the challenge demo, running value-chain optimization, asking the AI Harvest Advisor, generating Fair-Trade contracts, preparing Copilot MCP prompts, or validating Fabric IQ, Foundry IQ, and Work IQ flows.
---

# AgriValue IQ Operator

Use this skill to run and validate the AgriValue challenge demo without guessing through the UI.

## Core workflow

1. Start the app:

```bash
npm start
```

2. Verify API status:

```bash
curl http://localhost:3000/api/status
```

3. Use the agent action runner for deterministic interactions:

```bash
npm run agent:action -- portfolio --qty 10
npm run agent:action -- optimize --crop "Olive Oil" --qty 15 --organic true --quality 1.15
npm run agent:action -- advisor --crop Grapes --message "What compliance rules matter?"
npm run agent:action -- contract --crop "Olive Oil" --qty 15 --buyer "Cooperativa Valle del Belice" --organic true
```

## Demo route

For judging, prefer this story:

1. Open `/demo.html` for the two-minute teleprompter.
2. Open `/index.html` and run:
   - AI Portfolio Scan
   - Olive Oil optimization, 15 MT, DOP/DOC enabled
   - Vision quality scan
   - Export Contract
   - Copilot MCP prompt
   - Teams Alert if Work IQ is configured

## Agent deliverables

When asked to prepare or validate the project, return:

- API status: Fabric IQ source, Foundry configured/local, Work IQ on/off
- Top crop from portfolio scan and its added value
- One advisor response
- Whether contract generation works
- Any blocker for live Azure/Fabric/Graph configuration

## Public demo guardrails

Do not expose secrets. For public testing:

- Keep `.env` private.
- Use `.env.example` only for placeholders.
- Keep `CORS_ORIGINS` restricted to the GitHub Pages domain and local dev.
- Treat Teams/Graph and Foundry keys as production credentials.
