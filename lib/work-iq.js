/**
 * Work IQ — Microsoft Graph / Teams notifications for cooperative workflows.
 * Notifies teams when optimization completes or contracts are generated.
 */
import { ClientSecretCredential } from "@azure/identity";

function isGraphConfigured() {
  return Boolean(
    process.env.GRAPH_TENANT_ID &&
    process.env.GRAPH_CLIENT_ID &&
    process.env.GRAPH_CLIENT_SECRET &&
    process.env.TEAMS_TEAM_ID &&
    process.env.TEAMS_CHANNEL_ID
  );
}

function isWebhookConfigured() {
  return Boolean(process.env.TEAMS_WEBHOOK_URL);
}

async function getGraphToken() {
  const credential = new ClientSecretCredential(
    process.env.GRAPH_TENANT_ID,
    process.env.GRAPH_CLIENT_ID,
    process.env.GRAPH_CLIENT_SECRET
  );
  const token = await credential.getToken("https://graph.microsoft.com/.default");
  return token.token;
}

async function postViaGraph(htmlContent) {
  const token = await getGraphToken();
  const url = `https://graph.microsoft.com/v1.0/teams/${process.env.TEAMS_TEAM_ID}/channels/${process.env.TEAMS_CHANNEL_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: { contentType: "html", content: htmlContent },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error: ${res.status} ${err}`);
  }
  return res.json();
}

async function postViaWebhook(text) {
  const res = await fetch(process.env.TEAMS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Teams webhook error: ${res.status}`);
}

function formatOptimizationMessage(result) {
  const { crop, qtyTons, addedValue, processedPath } = result;
  return {
    title: `🌾 AgriValue Optimization — ${crop}`,
    html: `
      <h2>🌾 AgriValue Value-Chain Alert</h2>
      <p><strong>Crop:</strong> ${crop} (${qtyTons} MT)</p>
      <p><strong>Recommended route:</strong> ${processedPath.processor} → ${processedPath.processedProduct}</p>
      <p><strong>Added value vs silo:</strong> <span style="color:#10b981">$${addedValue.toLocaleString()}</span></p>
      <p><strong>Foundry compliance:</strong> ${processedPath.foundryIQRule?.slice(0, 200)}…</p>
      <p><em>Sent via Work IQ — Microsoft Graph</em></p>
    `,
    text: `AgriValue: ${qtyTons} MT ${crop} → ${processedPath.processor}. Added value: $${addedValue.toLocaleString()}`,
  };
}

export function getWorkIQStatus() {
  return {
    graphConfigured: isGraphConfigured(),
    webhookConfigured: isWebhookConfigured(),
    active: isGraphConfigured() || isWebhookConfigured(),
  };
}

export async function notifyOptimizationComplete(result) {
  if (!isGraphConfigured() && !isWebhookConfigured()) {
    return { sent: false, reason: "Work IQ not configured" };
  }

  const msg = formatOptimizationMessage(result);

  try {
    if (isGraphConfigured()) {
      await postViaGraph(msg.html);
      console.log("[WORK IQ] Teams notification sent via Microsoft Graph");
      return { sent: true, channel: "graph" };
    }
    await postViaWebhook(msg.text);
    console.log("[WORK IQ] Teams notification sent via webhook");
    return { sent: true, channel: "webhook" };
  } catch (err) {
    console.warn("[WORK IQ] Notification failed:", err.message);
    return { sent: false, error: err.message };
  }
}

export async function notifyContractGenerated({ crop, qtyTons, buyer }) {
  if (!isGraphConfigured() && !isWebhookConfigured()) {
    return { sent: false, reason: "Work IQ not configured" };
  }

  const text = `📄 New Fair-Trade contract drafted: ${qtyTons} MT ${crop} for ${buyer || "cooperative"}. Review in AgriValue Terminal.`;

  try {
    if (isGraphConfigured()) {
      await postViaGraph(`<p>${text}</p><p><em>Work IQ — contract workflow</em></p>`);
      return { sent: true, channel: "graph" };
    }
    await postViaWebhook(text);
    return { sent: true, channel: "webhook" };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}
