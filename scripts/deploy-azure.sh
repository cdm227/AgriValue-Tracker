#!/usr/bin/env bash
set -euo pipefail

REPO="/mnt/c/Users/calog/AgriValue-Tracker"
STAGE="/tmp/agrivalue-stage"
ZIP_BASE="/tmp/agrivalue"
ZIP_FILE="${ZIP_BASE}.zip"

rm -rf "$STAGE" "$ZIP_FILE"
mkdir -p "$STAGE"

cd "$REPO"
cp server.js mcp-server.js package.json package-lock.json "$STAGE/"
cp -r lib public scripts "$STAGE/"

python3 - <<'PY'
import shutil
shutil.make_archive('/tmp/agrivalue', 'zip', '/tmp/agrivalue-stage')
PY

az webapp deploy \
  -g rg-agrivalue \
  -n agrivalue-iq-prod \
  --src-path "$ZIP_FILE" \
  --type zip \
  --query "{status:status}" \
  -o json
