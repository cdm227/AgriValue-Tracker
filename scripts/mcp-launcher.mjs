#!/usr/bin/env node
/**
 * Copilot CLI / MCP launcher — always runs mcp-server.js from repo root
 * (fixes "Failed to connect" when CLI cwd is not the project directory).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverEntry = join(repoRoot, "mcp-server.js");

const child = spawn(process.execPath, [serverEntry], {
  cwd: repoRoot,
  stdio: "inherit",
  env: { ...process.env, AGRIVALUE_MCP: "1" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

child.on("error", (err) => {
  console.error("AgriValue MCP launcher failed:", err.message);
  process.exit(1);
});
