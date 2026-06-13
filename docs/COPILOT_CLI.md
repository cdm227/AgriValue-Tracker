# GitHub Copilot CLI — AgriValue MCP

Use **GitHub Copilot CLI** in the terminal with the same `agrivalue-iq` MCP server as VS Code — no duplicate logic, same three tools:

| Tool | Purpose |
|------|---------|
| `get_market_intelligence` | Fabric IQ pricing + compliance |
| `generate_supply_contract` | Fair-Trade contract draft |
| `evaluate_crop_quality` | Vision grade + profit multiplier |

## Prerequisites

1. [GitHub Copilot subscription](https://github.com/features/copilot/plans) (Free tier works with limits)
2. [Copilot CLI installed](https://docs.github.com/en/copilot/how-tos/copilot-cli/install-copilot-cli)
3. This repo cloned and dependencies installed:

```bash
git clone https://github.com/cdm227/AgriValue-Tracker.git
cd AgriValue-Tracker
npm install
```

## How it works

```
Terminal (copilot CLI)  →  .mcp.json  →  mcp-server.js  →  lib/iq-data.js
VS Code Copilot Chat    →  .vscode/mcp.json  →  (same server)
```

Repo-root **`.mcp.json`** is loaded automatically when you run Copilot CLI inside this project.

---

## Test locally (before you push)

### Step 1 — MCP smoke test (no Copilot CLI needed)

From the repo root:

```bash
npm run verify:mcp
```

Expected output:

```text
OK: AgriValue MCP server started (Fabric IQ synced)
```

Also confirm VS Code config still works:

```bash
npm run mcp
```

You should see on stderr: `AgriValue MCP Server running on stdio (Fabric IQ synced)` — press `Ctrl+C` to stop.

### Step 2 — Install Copilot CLI

Follow the official guide: [Install Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/install-copilot-cli)

Quick check:

```bash
copilot --version
```

Sign in if prompted (`copilot auth` or follow CLI prompts).

### Step 3 — Start CLI in this repo

**Important:** run Copilot CLI from the **repository root** so `.mcp.json` is picked up.

```bash
cd AgriValue-Tracker
copilot
```

### Step 4 — Verify MCP is loaded

Inside the interactive CLI:

```text
/mcp show
```

You should see **`agrivalue-iq`** listed.

Details and tools:

```text
/mcp show agrivalue-iq
```

Expect three tools: `get_market_intelligence`, `generate_supply_contract`, `evaluate_crop_quality`.

If the server is missing:

```text
/mcp reload
/mcp show
```

Or add manually (same as `.mcp.json`):

```text
/mcp add
```

- **Server Name:** `agrivalue-iq`
- **Type:** Local / STDIO
- **Command:** `node mcp-server.js`
- **Tools:** `*`

### Step 5 — Run a grounded prompt

In Copilot CLI (interactive):

```text
Use the agrivalue-iq MCP tools to get market intelligence for Olive Oil, then generate a Fair-Trade supply contract for 15 metric tons, organic/DOP enabled, buyer "Cooperativa Valle del Belice". Summarize Path A vs Path B added value.
```

One-shot from the shell (non-interactive):

```bash
copilot -p "Use agrivalue-iq get_market_intelligence for Olive Oil and generate_supply_contract for 15 tons organic with buyer Cooperativa Valle del Belice"
```

Exact flags depend on your CLI version — run `copilot --help` if `-p` differs.

### Step 6 — Match the web app workflow

1. Open `http://localhost:3000` (or [GitHub Pages demo](https://cdm227.github.io/AgriValue-Tracker))
2. Run **IQ Pipeline** → Olive Oil, 15 MT, organic
3. Click **Copy for Copilot MCP** in the UI
4. Paste the prompt into **Copilot CLI** instead of VS Code Chat

Same MCP tools, terminal instead of IDE.

---

## User guide (judges & contributors)

### VS Code vs CLI

| Surface | Config file | When to use |
|---------|-------------|-------------|
| **VS Code** | `.vscode/mcp.json` | IDE workflow, demo video cut to Copilot Chat |
| **Copilot CLI** | `.mcp.json` (repo root) | Terminal, automation, headless dev |

Both call **`scripts/mcp-launcher.mjs`** → **`mcp-server.js`** → **`lib/iq-data.js`**.

The launcher sets the repo root as cwd so Copilot CLI can connect reliably.

### Example prompts

**Market intel:**

```text
@agrivalue-iq get_market_intelligence crop="Grapes"
```

**Contract (after optimization):**

```text
@agrivalue-iq generate_supply_contract crop="Olive Oil" qtyTons=15 isOrganic=true buyer="Cooperativa Valle del Belice"

Add a force majeure clause for Sicilian harvest weather.
```

**Quality before optimize:**

```text
@agrivalue-iq evaluate_crop_quality crop="Olive Oil"
```

### MCP management commands

| Command | Action |
|---------|--------|
| `/mcp show` | List all MCP servers |
| `/mcp show agrivalue-iq` | Tools for this repo |
| `/mcp reload` | Reload after config change |
| `/mcp disable agrivalue-iq` | Turn off for session |
| `/mcp enable agrivalue-iq` | Turn back on |

### Troubleshooting

#### `Failed to connect to MCP server "agrivalue-iq"`

1. **Run from repo root** (where `.mcp.json` lives):

   ```bash
   cd /mnt/c/Users/calog/AgriValue-Tracker   # your clone path
   ls -la .mcp.json                          # must exist (use ls -a for dotfiles)
   ```

2. **Smoke test without Copilot CLI:**

   ```bash
   npm install
   npm run verify:mcp
   npm run mcp:cli    # should log: AgriValue MCP Server running on stdio — Ctrl+C to stop
   ```

3. **Reload MCP in Copilot CLI:**

   ```text
   /mcp reload
   /mcp show agrivalue-iq
   ```

4. **Trust the folder** — on first launch Copilot CLI may ask to trust the workspace; MCP from `.mcp.json` loads only after trust.

5. **WSL vs Windows** — run Copilot CLI in the **same environment** as Node:
   - WSL: `which node` and `copilot` both inside WSL
   - Windows: use PowerShell/CMD, not WSL `/mnt/c/...` mixed with Windows `copilot.exe`

6. **Manual add** (if `.mcp.json` is not picked up):

   ```text
   /mcp add
   ```

   - Name: `agrivalue-iq`
   - Type: **STDIO**
   - Command: `node scripts/mcp-launcher.mjs`
   - Tools: `*`

   Or edit `~/.copilot/mcp-config.json` with the same entry (use absolute path to `scripts/mcp-launcher.mjs` if needed).

7. **Fabric SQL in `.env`** — if `FABRIC_SQL_*` is set but unreachable, the server still starts (sync runs in background). Remove or fix `.env` if startup is slow.

| Problem | Fix |
|---------|-----|
| `agrivalue-iq` not in `/mcp show` | Run CLI from repo root; `ls -la .mcp.json` |
| MCP server fails to start | `npm run verify:mcp` and `npm run mcp:cli` |
| Wrong crop / empty tools | Crops: Olive Oil, Grapes, Wheat, Coffee, Milk |
| Plain `ls` hides config | Use `ls -a` to see `.mcp.json`, `.gitattributes`, etc. |

### No secrets required

MCP uses in-memory Fabric IQ demo data by default. Azure/Fabric env vars in `.env` are optional — same as the web app.

---

## Related docs

- [COPILOT.md](COPILOT.md) — VS Code + how Copilot built the project
- [MICROSOFT_IQ.md](MICROSOFT_IQ.md) — Fabric / Foundry / Work IQ
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — 2-min judge video script
