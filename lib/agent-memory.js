/**
 * Agent memory — in-session trade history for Don Salvatore, Matteo, and Sofia.
 * Persists optimization runs so agents can reference past deals.
 */

const MAX_TRADES = 50;
const trades = [];

export function recordTrade(entry) {
  const record = {
    id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    agents: ["Don Salvatore", "Matteo", "Sofia DOP"],
    ...entry,
  };
  trades.unshift(record);
  if (trades.length > MAX_TRADES) trades.length = MAX_TRADES;
  return record;
}

export function getTradeHistory(limit = 20) {
  return trades.slice(0, Math.min(limit, MAX_TRADES));
}

export function formatTradeMemoryReply(trades, lang = "en") {
  if (!trades?.length) {
    return lang === "it"
      ? "**Don Salvatore:** Non abbiamo ancora memoria di trade, compare. Fai una pipeline e la salvo per te."
      : "**Don Salvatore:** No trade memory yet, compare. Run the IQ pipeline once and I will remember it.";
  }
  const lines = trades.slice(0, 5).map((t) => {
    const date = new Date(t.at).toLocaleDateString(lang === "it" ? "it-IT" : "en-US");
    const vision =
      t.qualityMultiplier && t.qualityMultiplier !== 1 ? ` · Vision ${t.qualityMultiplier}x` : "";
    return `• ${date}: **${t.crop}** ${t.qtyTons} MT → +$${Number(t.addedValue || 0).toLocaleString()} added value${vision}`;
  });
  return lang === "it"
    ? `**Don Salvatore:** Ecco la memoria degli agenti — gli ultimi trade salvati:\n${lines.join("\n")}`
    : `**Don Salvatore:** Agent memory — your recent saved trades:\n${lines.join("\n")}`;
}
