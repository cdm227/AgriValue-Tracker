/**
 * Client-side agent memory (localStorage) — trade history for static + live modes.
 */

const STORAGE_KEY = "agrivalue-trade-history";
const MAX_TRADES = 25;

export function loadTradeHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTradeRecord(record) {
  const entry = {
    id: `tr-${Date.now()}`,
    at: new Date().toISOString(),
    agents: ["Don Salvatore", "Matteo", "Sofia DOP"],
    ...record,
  };
  const history = [entry, ...loadTradeHistory()].slice(0, MAX_TRADES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return entry;
}

export function renderTradeHistory(listEl) {
  if (!listEl) return;
  const trades = loadTradeHistory();
  if (!trades.length) {
    listEl.innerHTML = `<p class="trade-history-empty">No trades yet. Run the IQ pipeline — agents remember every deal.</p>`;
    return;
  }
  listEl.innerHTML = trades.slice(0, 8).map((t) => {
    const date = new Date(t.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const vision = t.qualityMultiplier && t.qualityMultiplier !== 1
      ? `<span class="trade-vision">Vision ${t.qualityMultiplier}x</span>`
      : "";
    const organic = t.isOrganic ? `<span class="trade-dop">DOP</span>` : "";
    return `<div class="trade-history-item">
      <div class="trade-history-top"><strong>${t.crop}</strong> · ${t.qtyTons} MT ${organic}${vision}</div>
      <div class="trade-history-meta">+${formatMoney(t.addedValue)} · ${date}</div>
    </div>`;
  }).join("");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function getRecentTradesForAdvisor(limit = 5) {
  return loadTradeHistory().slice(0, limit);
}
