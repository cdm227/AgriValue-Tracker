# 2-Minute Demo Video Script

Use this script to record your submission video. Open **two windows**: AgriValue terminal + VS Code with Copilot MCP.

## Recording Setup

1. Open `https://cdm227.github.io/AgriValue-Tracker/demo.html` (or `http://localhost:3000/demo.html`)
2. Click **Start 2-Min Demo** — teleprompter guides timing
3. Side-by-side: VS Code with Copilot Chat + MCP enabled
4. Record with OBS, Xbox Game Bar (Win+G), or Loom

## Script (120 seconds)

### 0:00–0:20 — Problem & Intro

> "Smallholder farmers in Sicily often sell olives and grapes to bulk silos at commodity prices. AgriValue shows them a better path — local processing that captures DOP and DOC premiums."

**Screen:** Welcome screen with Triple IQ pipeline cards.

### 0:20–0:50 — Fabric IQ

> "Fabric IQ maps the semantic market graph — processors, prices, and transport costs across Sicily."

**Actions:**
1. Select **Olive Oil**, quantity **15 MT**
2. Click **Run IQ Pipeline**
3. Point to Path A vs Path B comparison and added value figure

### 0:50–1:20 — Foundry IQ + Vision

> "Foundry IQ grounds compliance in real standards — EU DOP, USDA Organic. The vision scan grades crop quality and boosts Path B revenue."

**Actions:**
1. Check **DOP / DOC Certified**
2. Upload a crop photo (optional)
3. Highlight typewriter Foundry compliance response

### 1:20–1:50 — Copilot MCP Contract

> "With one click, I copy the MCP prompt into VS Code. Copilot uses our AgriValue MCP server to draft a Fair-Trade supply contract from live pricing."

**Actions:**
1. Click **Copilot MCP** button
2. Switch to VS Code Copilot Chat
3. Paste and run:

```
@agrivalue-iq generate_supply_contract crop="Olive Oil" qtyTons=15 isOrganic=true buyer="Cooperativa Valle del Belice"

Customize for EU DOP export to the US market.
```

4. Show generated contract markdown

### 1:50–2:00 — Work IQ

> "Work IQ notifies the cooperative on Microsoft Teams — so the whole value chain sees the optimization instantly."

**Action:** Click **Teams Alert** or show Teams channel notification.

---

## Auto-Demo Page

`public/demo.html` runs a timed teleprompter and auto-starts optimization at `index.html?autoplay=1`.

## What Judges Should See

- [ ] Three IQ layers active (header pills)
- [ ] Meaningful added value number
- [ ] Foundry grounded compliance text
- [ ] Copilot + MCP generating contract in IDE
- [ ] Teams notification (or Work IQ configured in `/api/status`)
