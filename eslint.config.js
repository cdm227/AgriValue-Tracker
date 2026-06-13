import js from "@eslint/js";
import globals from "globals";

const nodeFiles = [
  "lib/**/*.js",
  "server.js",
  "mcp-server.js",
  "scripts/**/*.js",
  "scripts/**/*.mjs",
  "tests/**/*.js",
];

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/**", "public/js/fabric-iq-client.js", "public/config.js"],
  },
  {
    files: nodeFiles,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["public/js/**/*.js", "public/mock-api.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        AGRIVALUE_CONFIG: "readonly",
        lucide: "readonly",
        Chart: "readonly",
        showIntro: "readonly",
        runDemoVisionScan: "readonly",
        optimizeChain: "readonly",
      },
    },
  },
];
