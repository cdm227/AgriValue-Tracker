import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CROP_NAMES,
  getMarketIntelligence,
  generateSupplyContract,
  evaluateQuality,
  optimizeValueChain,
} from "../lib/fabric-iq.js";

describe("CROP_NAMES", () => {
  it("includes five Sicilian crops", () => {
    assert.equal(CROP_NAMES.length, 5);
    assert.ok(CROP_NAMES.includes("Olive Oil"));
  });
});

describe("getMarketIntelligence", () => {
  it("returns pricing and compliance for Olive Oil", () => {
    const intel = getMarketIntelligence("Olive Oil");
    assert.ok(intel);
    assert.equal(intel.crop, "Olive Oil");
    assert.ok(intel.rawPrice > 0);
    assert.ok(intel.summary.includes("Olive Oil"));
  });

  it("returns null for unknown crop", () => {
    assert.equal(getMarketIntelligence("Corn"), null);
  });
});

describe("optimizeValueChain", () => {
  it("Path B beats Path A for Olive Oil with organic premium", () => {
    const result = optimizeValueChain({
      crop: "Olive Oil",
      qtyTons: 15,
      isOrganic: true,
      qualityMultiplier: 1.15,
    });
    assert.ok(result);
    assert.equal(result.crop, "Olive Oil");
    assert.ok(result.addedValue > 50000);
    assert.ok(result.processedPath.net > result.rawPath.net);
    assert.ok(result.agentTrace.goldenSeal);
  });

  it("returns null for invalid crop", () => {
    assert.equal(optimizeValueChain({ crop: "Unknown", qtyTons: 10, isOrganic: false }), null);
  });
});

describe("generateSupplyContract", () => {
  it("includes crop, quantity, and compliance sections", () => {
    const md = generateSupplyContract({
      crop: "Olive Oil",
      qtyTons: 15,
      buyer: "Cooperativa Valle del Belice",
      isOrganic: true,
    });
    assert.ok(md.includes("Olive Oil"));
    assert.ok(md.includes("15 metric tons"));
    assert.ok(md.includes("Fair-Trade") || md.includes("SUPPLY"));
  });
});

describe("evaluateQuality", () => {
  it("returns grade and multiplier for Grapes", () => {
    const q = evaluateQuality("Grapes");
    assert.ok(q.grade);
    assert.ok(q.multiplier >= 1);
  });
});
