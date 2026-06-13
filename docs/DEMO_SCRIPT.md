# 2-Minute Demo Video Script

Use this script for your **Agents League submission video**. It matches the live teleprompter on `demo.html` (Vision step, agent memory, auto-narration).

## Before you record

1. Open the **live judge demo** (no clone required): [demo.html](https://cdm227.github.io/AgriValue-Tracker/demo.html)
2. Open **VS Code** in this repo with GitHub Copilot + MCP (`.vscode/mcp.json` registers `agrivalue-iq`)
3. In a terminal: `npm install` then `npm run mcp` (optional — MCP also starts when Copilot connects)
4. Turn on **Audio Narration** on the demo page if you want the built-in voice-over (or narrate yourself)
5. Use **OBS**, **Xbox Game Bar (Win+G)**, or **Loom** to capture screen + mic

## Layout (recommended)

| Window                   | Content                                        |
| ------------------------ | ---------------------------------------------- |
| Primary                  | `demo.html` → click **Start 2-Min Judge Demo** |
| Secondary (split or cut) | VS Code Copilot Chat with `@agrivalue-iq`      |

## Teleprompter flow (~128 seconds)

The demo page auto-advances. Follow the green **script line** and **workflow map** (Harvest → Don → Matteo → Sofia → Vision → Copilot).

### 0:00–0:18 — Problem & agents

> "Sicilian farmers often sell raw olives and grapes to bulk silos at commodity prices. AgriValue is a creative app where friendly AI agents work together — Don Salvatore listens, Matteo runs the numbers, Sofia checks quality."

**Screen:** Story cards + 6-node flow map. Intro video may auto-play muted.

### 0:18–0:45 — Fabric IQ (Matteo)

> "Fabric IQ maps processors, prices, and transport — Matteo compares Path A raw sale vs Path B local processing."

**Screen:** Live app segment opens (`index.html?autoplay=1`). Watch portfolio/optimize run. Point to **added value** and Path A vs Path B.

**Teleprompter cues:** Olive Oil, 15 MT, organic/DOP if shown.

### 0:45–1:05 — Sofia + Foundry compliance

> "Sofia DOP checks the serious papers — EU DOP, organic evidence — before we claim the premium."

**Screen:** Foundry typewriter compliance text in the IQ console.

### 1:05–1:18 — Vision scan

> "Vision scans the crop photo and applies a quality multiplier to Path B revenue."

**Screen:** Vision Quality Scan animation / grade badge. Brief pause after Sofia before Vision (teleprompter bridge cue ~52s).

### 1:18–1:35 — Agent memory

> "Every optimization is saved to agent memory — Don Salvatore can recall recent trades in the AI Advisor."

**Screen:** Trade history / advisor memory panel (ask "show trade history" or open memory UI if visible).

### 1:35–1:55 — Copilot MCP contract

> "One click copies the MCP prompt. Copilot uses our AgriValue MCP server to draft a Fair-Trade supply contract from live pricing."

**Actions in VS Code Copilot Chat:**

```
@agrivalue-iq generate_supply_contract crop="Olive Oil" qtyTons=15 isOrganic=true buyer="Cooperativa Valle del Belice"

Customize for EU DOP export to the US market.
```

Show the generated contract markdown.

### 1:55–2:08 — Work IQ + close

> "Work IQ can alert the cooperative on Teams. Mamma mia — andiamo!"

**Action:** Click **Teams Alert** in the app (or show Work IQ pill / `/api/status`). End on teleprompter finale.

---

## Manual recording (without auto-demo)

If you prefer full manual control:

1. Open [index.html](https://cdm227.github.io/AgriValue-Tracker/)
2. Run IQ Pipeline: Olive Oil, 15 MT, DOP enabled
3. Run Vision scan → optimize → export contract → Copilot MCP → Teams
4. Cut to VS Code for the MCP contract step above

## What judges should see

- [ ] Six-step workflow (including **Vision** and **Copilot**)
- [ ] Meaningful **added value** number
- [ ] Foundry grounded compliance text
- [ ] **Agent memory** / trade history
- [ ] **Copilot + MCP** generating contract in IDE
- [ ] Work IQ / Teams (or configured status in API)

## Upload

1. Export MP4 (≤2–3 min is fine; teleprompter targets ~2 min)
2. Upload to YouTube (unlisted) or Loom
3. Paste the link in the [Agents League portal](https://aka.ms/agentsleague/aisf) with your repo URL

**Repo URL for judges:** https://github.com/cdm227/AgriValue-Tracker (`PROD` default branch).
