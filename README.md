# 🌾 AgriValue Tracker

AgriValue is an interactive agricultural value-chain optimization application built for **Battle #1: Creative Apps with GitHub Copilot** in the AI Agents League.

Our mission is to empower local smallholder farmers by calculating the **best added value** for their harvests. Instead of selling raw agricultural commodities to bulk monopolistic silos at minimal prices, AgriValue highlights local processing paths (such as organic flour milling or ethical coffee roasting) that maximize net profit margins.

## 🧠 Microsoft IQ Integration
This application integrates two layers of Microsoft IQ:
1. **Fabric IQ (Semantic Market Graph)**: Maps out local cooperatives, processing plants, crop values, and transport costs to dynamically compute the most profitable value-added route.
2. **Foundry IQ (Compliance Advisory)**: Grounded verification checker that ensures raw crops meet required organic or ethical trade standards (such as FLO-CERT-2026 or USDA Organic) to lock in specialty premium pricing bonuses.

## 🤖 GitHub Copilot & MCP Usage
GitHub Copilot was actively utilized during development:
*   **Boilerplate Scaffolding**: Copilot speed-scaffolded the Express backend structures and model parameters.
*   **Model Context Protocol (MCP)**: Built a custom MCP server in `mcp-server.js` exposing the `get_market_intelligence` tool so Copilot can automatically write legally-grounded Fair-Trade supply contracts directly inside VS Code based on real pricing.
