# Azure Deployment Guide

Deploy the AgriValue backend to **Azure App Service** so GitHub Pages can call live Foundry IQ, Fabric lakehouse, and Work IQ APIs.

## Architecture

```
GitHub Pages (static UI)  ──fetch──►  Azure App Service (Node.js API)
     │                                      │
     │  config.js                           ├── Fabric IQ (SQL)
     │  apiBase: https://xxx.azurewebsites.net  ├── Foundry IQ (Azure Agent)
     └─ public/ only                        └── Work IQ (Graph API)
```

## One-Time Setup

### 1. Provision Azure resources

```bash
az group create --name rg-agrivalue --location westeurope

az deployment group create \
  --resource-group rg-agrivalue \
  --template-file infra/main.bicep \
  --parameters appName=agrivalue-iq-prod
```

Note the `apiUrl` output (e.g. `https://agrivalue-iq-prod.azurewebsites.net`).

### 2. Configure App Service environment variables

In Azure Portal → App Service → Configuration → Application settings:

| Setting                      | Purpose                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `FOUNDRY_OPENAI_BASE_URL`    | Foundry OpenAI v1 base URL, e.g. `https://...services.ai.azure.com/openai/v1`        |
| `FOUNDRY_MODEL_DEPLOYMENT`   | Model deployment name, e.g. `gpt-4o`                                                 |
| `FOUNDRY_RESPONSES_ENDPOINT` | Foundry project agent Responses endpoint                                             |
| `FOUNDRY_API_KEY`            | Optional key. If omitted, App Service uses managed identity / DefaultAzureCredential |
| `AZURE_AI_AGENT_ID`          | Legacy Azure OpenAI agent ID fallback                                                |
| `AZURE_OPENAI_ENDPOINT`      | Legacy Azure OpenAI endpoint fallback                                                |
| `AZURE_OPENAI_API_KEY`       | Legacy Azure OpenAI API key fallback                                                 |
| `FABRIC_SQL_SERVER`          | Fabric warehouse SQL endpoint                                                        |
| `FABRIC_SQL_DATABASE`        | Database name                                                                        |
| `GRAPH_TENANT_ID`            | Work IQ — Entra tenant                                                               |
| `GRAPH_CLIENT_ID`            | App registration client ID                                                           |
| `GRAPH_CLIENT_SECRET`        | Client secret                                                                        |
| `TEAMS_TEAM_ID`              | Teams team ID                                                                        |
| `TEAMS_CHANNEL_ID`           | Channel ID                                                                           |
| `CORS_ORIGINS`               | `https://cdm227.github.io`                                                           |

### 3. GitHub Secrets

Add these repository secrets:

| Secret                         | Value                                            |
| ------------------------------ | ------------------------------------------------ |
| `AZURE_WEBAPP_NAME`            | App name from Bicep (e.g. `agrivalue-iq-prod`)   |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from Azure Portal → Get publish profile |
| `AZURE_API_URL`                | `https://agrivalue-iq-prod.azurewebsites.net`    |

### 4. Enable GitHub Environments

Create environment `azure-production` in repo Settings → Environments (optional protection rules).

## Deploy

- **Backend:** Push to `PROD` → `.github/workflows/azure-deploy.yml` deploys full app
- **Frontend:** Push to `PROD` → `.github/workflows/static.yml` deploys `public/` with injected `config.js`

## Verify

1. Open `https://YOUR-APP.azurewebsites.net/api/status`
2. Open `https://cdm227.github.io/AgriValue-Tracker`
3. IQ pills should show live Fabric/Foundry/Work status from Azure

## Fabric Lakehouse Setup

Run `infra/fabric-schema.sql` in your Fabric Warehouse SQL endpoint, then set `FABRIC_SQL_*` env vars. The server syncs on startup and every 5 minutes.

## Work IQ — Graph API Permissions

Register an app in Entra ID with application permission `ChannelMessage.Send` and admin consent. Alternatively use `TEAMS_WEBHOOK_URL` for a simpler incoming webhook.

## Local development with remote API

```bash
# Test GitHub Pages behavior locally
echo "window.AGRIVALUE_CONFIG={apiBase:'http://localhost:3000',staticFallback:false};" > public/config.js
npm start
# Open public/index.html via live server or http://localhost:3000
```

## Codespaces / Public Users

For reviewers and public users, no shared credentials are required. The app runs with in-memory demo data unless they configure their own `.env`.

```bash
npm install
npm start
```

Open the forwarded port `3000` URL. Same-origin Codespaces URLs are allowed by the API origin gate, while unrelated external sites remain blocked.

Optional user-owned integrations:

- Foundry IQ: `FOUNDRY_OPENAI_BASE_URL`, `FOUNDRY_MODEL_DEPLOYMENT`
- Fabric IQ: `FABRIC_SQL_SERVER`, `FABRIC_SQL_DATABASE`
- Work IQ: `TEAMS_WEBHOOK_URL` or Microsoft Graph app settings
