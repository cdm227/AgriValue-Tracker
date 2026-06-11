import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const root = path.dirname(fileURLToPath(import.meta.url));
const apiUrl = (process.env.AZURE_API_URL || "").replace(/\/$/, "");

const config = `// Auto-generated — do not edit. Azure API for GitHub Pages frontend.
window.AGRIVALUE_CONFIG = {
  apiBase: "${apiUrl}",
  staticFallback: ${apiUrl ? "false" : "true"},
};
`;

writeFileSync(path.join(root, "../public/config.js"), config);
console.log(apiUrl ? `Injected API URL: ${apiUrl}` : "No AZURE_API_URL — static fallback mode");
