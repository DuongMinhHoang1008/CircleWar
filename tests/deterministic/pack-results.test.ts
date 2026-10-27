import { describe, expect, it } from "vitest";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";
import {
  normalizePackResult,
  comparePackResults,
} from "../../apps/web/src/packResults";

describe("pack result printed rarity", () => {
  it("repairs saved evolved character colors and records inventory rarity separately", () => {
    const card = ROSTER.find((c) => c.tier === "T1")!;
    const result = normalizePackResult({
      kind: "character",
      id: card.id,
      tier: "GOD",
      rarity: "GOD",
      level: 7,
    });
    expect(result.tier).toBe("T1");
    expect(result.rarity).toBe("Thường");
    expect(result.evolvedTier).toBe("T3");
  });
  it("sorts base legendary cards before evolved common cards", () => {
    const common = ROSTER.find((c) => c.tier === "T1")!,
      legendary = ROSTER.find((c) => c.tier === "T4")!;
    const results = [
      {
        kind: "character",
        id: common.id,
        tier: "GOD",
        rarity: "GOD",
        level: 7,
      },
      {
        kind: "character",
        id: legendary.id,
        tier: "T4",
        rarity: "Huyền thoại",
        level: 1,
      },
    ]
      .sort(comparePackResults)
      .map(normalizePackResult);
    expect(results.map((r) => r.id)).toEqual([legendary.id, common.id]);
  });
  it("uses printed item rarity and preserves the training evolution flow", () => {
    const item = CATALOG_ITEMS.find((item) => item.rarity === 0)!;
    const result = normalizePackResult({
      kind: "item",
      id: item.id,
      tier: "T3",
      rarity: "Sử thi",
      level: 7,
    });
    expect(result.tier).toBe("T1");
    expect(result.evolvedTier).toBe("T3");
    const training = { ...result, tier: "T3", batchCount: 0 };
    expect(normalizePackResult(training)).toBe(training);
  });
});
