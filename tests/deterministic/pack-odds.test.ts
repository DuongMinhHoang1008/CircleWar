import { describe, expect, it } from "vitest";
import { PACK_ODDS, packPool, packTier } from "../../packages/shared/src/packs";
import { applyAction, newRoom } from "../../packages/shared/src/room";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";

describe("normal and boss pack odds", () => {
  it("has exactly 10× epic and legendary base probability, independent of pool sizes", () => {
    for (const kind of ["normal", "boss"] as const) {
      const observed: Record<string, number> = { T1: 0, T2: 0, T3: 0, T4: 0 };
      for (let i = 0; i < 10000; i++)
        observed[packTier(kind, (i + 0.5) / 100)]++;
      expect(observed).toEqual(
        Object.fromEntries(
          Object.entries(PACK_ODDS[kind]).map(([tier, chance]) => [
            tier,
            chance * 100,
          ]),
        ),
      );
      expect(Object.values(PACK_ODDS[kind]).reduce((a, b) => a + b, 0)).toBe(
        100,
      );
    }
    expect(PACK_ODDS.boss.T3).toBe(PACK_ODDS.normal.T3 * 10);
    expect(PACK_ODDS.boss.T4).toBe(PACK_ODDS.normal.T4 * 10);
    expect(packTier("normal", 0, 19)).toBe("T2");
    expect(packTier("boss", 0, 19)).toBe("T1");
  });
  it("uses available rarities without silently wasting max-level pulls", () => {
    const cards = [{ tier: "T1" }, { tier: "T3" }, { tier: "T4" }];
    expect(packPool(cards, "T2")).toEqual([{ tier: "T3" }]);
    expect(packPool(cards, "T1", true)).toEqual([{ tier: "T4" }]);
    expect(packPool([{ tier: "T2" }], "T4")).toEqual([{ tier: "T2" }]);
    expect(packPool([], "T4")).toEqual([]);
  });
  it("debits the boss balance, preserves normal pity and refuses unavailable packs atomically", () => {
    let s = applyAction(
      newRoom("BOSSPACK", 1, 0),
      "a",
      { type: "JOIN", name: "A" },
      1,
    );
    Object.assign(s.players[0], {
      bossPacks: 2,
      packs: 10,
      packsSinceRare: 19,
      packsSinceHighRarity: 99,
    });
    s = applyAction(s, "a", { type: "OPEN_PACK", kind: "boss" }, 2);
    expect(s.players[0]).toMatchObject({
      bossPacks: 1,
      packs: 10,
      packsSinceRare: 19,
      packsSinceHighRarity: 99,
    });
    s.players[0].cards = ROSTER.map((c) => ({
      characterId: c.id as never,
      level: 10,
      xp: 0,
    }));
    s.players[0].itemCards = CATALOG_ITEMS.map((it) => ({
      itemId: it.id,
      level: 10,
      xp: 0,
    }));
    const before = JSON.stringify(s);
    expect(() =>
      applyAction(s, "a", { type: "OPEN_PACK", kind: "boss" }, 3),
    ).toThrow("Tất cả thẻ");
    expect(JSON.stringify(s)).toBe(before);
  });
});
