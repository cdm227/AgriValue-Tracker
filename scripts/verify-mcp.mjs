/**
 * Smoke-test MCP server startup (no Copilot CLI required).
 * Run: npm run verify:mcp
 */
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(repoRoot, ".mcp.json"), "utf8"));
const server = cfg.mcpServers?.["agrivalue-iq"];

if (!server) {
  console.error("FAIL: .mcp.json missing mcpServers.agrivalue-iq");
  process.exit(1);
}

const launcherPath = join(repoRoot, "scripts", "mcp-launcher.mjs");
if (!existsSync(launcherPath)) {
  console.error("FAIL: scripts/mcp-launcher.mjs not found");
  process.exit(1);
}

// Test mcp-server.js directly (launcher uses stdio:inherit — not capturable here).
const proc = spawn(process.execPath, [join(repoRoot, "mcp-server.js")], {
  stdio: ["ignore", "pipe", "pipe"],
  cwd: repoRoot,
  env: { ...process.env, AGRIVALUE_MCP: "1" },
});

let stderr = "";
proc.stderr.on("data", (chunk) => {
  stderr += chunk;
});

const TIMEOUT_MS = 15000;

const timeout = setTimeout(() => {
  if (stderr.includes("running on stdio")) {
    console.log("OK: AgriValue MCP server started");
    console.log(`    .mcp.json → node ${server.args?.join(" ") ?? "scripts/mcp-launcher.mjs"}`);
    proc.kill();
    process.exit(0);
  }
  console.error(`FAIL: MCP server did not log startup within ${TIMEOUT_MS / 1000}s`);
  console.error(stderr || "(no stderr — try: npm run mcp:cli)");
  proc.kill();
  process.exit(1);
}, TIMEOUT_MS);

proc.on("error", (err) => {
  clearTimeout(timeout);
  console.error("FAIL: could not spawn MCP server:", err.message);
  process.exit(1);
});

proc.on("exit", (code) => {
  clearTimeout(timeout);
  if (stderr.includes("running on stdio")) {
    console.log("OK: AgriValue MCP server started");
    process.exit(0);
  }
  if (code !== null && code !== 0) {
    console.error("FAIL: MCP server exited early with code", code);
    console.error(stderr || "(no stderr)");
    process.exit(1);
  }
});
