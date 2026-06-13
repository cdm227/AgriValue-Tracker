import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recordTrade, getTradeHistory, formatTradeMemoryReply } from "../lib/agent-memory.js";

describe("agent memory", () => {
  it("formatTradeMemoryReply handles empty history", () => {
    const reply = formatTradeMemoryReply([], "en");
    assert.ok(reply.includes("No trade memory"));
  });

  it("formatTradeMemoryReply lists recent trades", () => {
    const trades = [
      {
        at: new Date().toISOString(),
        crop: "Olive Oil",
        qtyTons: 15,
        addedValue: 97000,
        qualityMultiplier: 1.15,
      },
    ];
    const reply = formatTradeMemoryReply(trades, "en");
    assert.ok(reply.includes("Olive Oil"));
    assert.ok(reply.includes("97,000") || reply.includes("97000"));
    assert.ok(reply.includes("Vision"));
  });

  it("recordTrade returns id and timestamp", () => {
    const entry = recordTrade({
      crop: "Grapes",
      qtyTons: 10,
      addedValue: 5000,
    });
    assert.ok(entry.id.startsWith("tr-"));
    assert.ok(entry.at);
    assert.ok(getTradeHistory(5).some((t) => t.id === entry.id));
  });
});
