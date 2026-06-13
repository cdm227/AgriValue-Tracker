import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { chdir } from "node:process";
import {
  CROP_NAMES,
  getMarketIntelligence,
  generateSupplyContract,
  evaluateQuality,
} from "./lib/fabric-iq.js";

chdir(dirname(fileURLToPath(import.meta.url)));

const server = new Server(
  { name: "agrivalue-iq-mcp", version: "1.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_market_intelligence",
      description:
        "Retrieves Fabric IQ semantic market graph data and Foundry IQ compliance rules for a Sicilian crop. Use when Copilot needs grounded pricing, processor networks, or certification requirements.",
      inputSchema: {
        type: "object",
        properties: {
          crop: {
            type: "string",
            enum: CROP_NAMES,
            description: "Sicilian agricultural commodity",
          },
        },
        required: ["crop"],
      },
    },
    {
      name: "generate_supply_contract",
      description:
        "Generates a Fair-Trade supply agreement draft using Fabric IQ pricing and Foundry IQ compliance rules. Use when the user asks Copilot to write or customize an agricultural contract in VS Code.",
      inputSchema: {
        type: "object",
        properties: {
          crop: { type: "string", enum: CROP_NAMES },
          qtyTons: { type: "number", description: "Quantity in metric tons" },
          buyer: { type: "string", description: "Seller/cooperative name" },
          isOrganic: {
            type: "boolean",
            description: "Whether DOP/DOC or organic certification applies",
          },
        },
        required: ["crop", "qtyTons"],
      },
    },
    {
      name: "evaluate_crop_quality",
      description:
        "Returns Foundry Vision-style quality grading and profit multiplier for a crop type. Use before optimization to factor visual quality into value-chain math.",
      inputSchema: {
        type: "object",
        properties: {
          crop: { type: "string", enum: CROP_NAMES },
        },
        required: ["crop"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_market_intelligence") {
    const intel = getMarketIntelligence(args?.crop);
    if (!intel) throw new Error(`Unknown crop: ${args?.crop}`);
    return { content: [{ type: "text", text: intel.summary }] };
  }

  if (name === "generate_supply_contract") {
    const contract = generateSupplyContract({
      crop: args?.crop,
      qtyTons: args?.qtyTons,
      buyer: args?.buyer,
      isOrganic: args?.isOrganic ?? false,
    });
    if (!contract) throw new Error(`Unknown crop: ${args?.crop}`);
    return { content: [{ type: "text", text: contract }] };
  }

  if (name === "evaluate_crop_quality") {
    const result = evaluateQuality(args?.crop);
    if (!result) throw new Error(`Unknown crop: ${args?.crop}`);
    return {
      content: [
        {
          type: "text",
          text: `Grade: ${result.grade}\nMultiplier: ${result.multiplier}x\nAnalysis: ${result.analysis}`,
        },
      ],
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgriValue MCP Server running on stdio");
}

main().catch(console.error);
