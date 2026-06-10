import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "agrivalue-iq-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_market_intelligence",
        description: "Retrieves Fabric IQ values and Foundry IQ guidelines to write agricultural contracts.",
        inputSchema: {
          type: "object",
          properties: {
            crop: { type: "string", enum: ["Wheat", "Coffee", "Milk"] }
          },
          required: ["crop"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "get_market_intelligence") {
    throw new Error("Tool not found");
  }

  const crop = request.params.arguments?.crop;
  let text = "";

  if (crop === "Wheat") {
    text = "Raw wheat Silo: $220/ton. Organic Flour: $380/ton (+ $45/ton organic premium). Rule: Wheat must be milled in a certified organic milling facility (USDA-ORGANIC-CLASS1).";
  } else if (crop === "Coffee") {
    text = "Raw coffee: $1,500/ton. Specialty roasted: $2,900/ton (+ $250/ton FairTrade bonus). Rule: Ethically sourced under FLO-CERT-2026 guidelines.";
  } else if (crop === "Milk") {
    text = "Bulk raw milk: $400/ton. Artisanal cheese: $1,100/ton (+ $90/ton grass-fed bonus). Rule: Pasture-raised grass-fed standards.";
  }

  return {
    content: [{ type: "text", text }]
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgriValue MCP Server actively running on stdio!");
}

main().catch(console.error);
