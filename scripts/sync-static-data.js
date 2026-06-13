#!/usr/bin/env node
/** Keeps public/js/fabric-iq-client.js in sync with lib/fabric-iq.js for GitHub Pages */
import { copyFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const root = path.dirname(fileURLToPath(import.meta.url));
copyFileSync(
  path.join(root, "../lib/fabric-iq.js"),
  path.join(root, "../public/js/fabric-iq-client.js")
);
console.log("Synced fabric-iq.js → public/js/fabric-iq-client.js");
