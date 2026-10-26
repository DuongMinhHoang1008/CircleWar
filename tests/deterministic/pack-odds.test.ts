import { describe, expect, it } from "vitest";
import { PACK_ODDS, packPool, packTier, packDrawPool, nextBossPity, normalizeBossPity } from "../../packages/shared/src/packs";
import { applyAction, newRoom } from "../../packages/shared/src/room";
import { ROSTER, CATALOG_ITEMS } from "../../packages/shared/src/catalog";

describe("normal and boss pack odds", () => {
  it("guarantees only legendary at Boss draw 50, while epic never resets its counter", () => {
    const pool = [{ tier: "T1" }, { tier: "T3" }, { tier: "T4" }];
    expect(packDrawPool(pool, "boss", 0, 19, 99, 49)).toEqual([{ tier: "T4" }]);
    expect(packDrawPool(pool.slice(0, 2), "boss", 0, 0, 0, 49)).toEqual([]);
    expect(nextBossPity(48, "T3")).toBe(49);
    expect(nextBossPity(49, "T4")).toBe(0);
    expect(packDrawPool(pool, "normal", 0, 0, 0, 49)).toEqual([{ tier: "T1" }]);
    expect(normalizeBossPity(Infinity)).toBe(0);
    expect(normalizeBossPity(-10)).toBe(0);
    expect(normalizeBossPity(200)).toBe(49);
  });
  it("retains Boss pack and pity atomically if every legendary is already maxed", () => {
    let state = applyAction(newRoom("PITYTEST", 1, 0), "a", { type: "JOIN", name: "A" }, 1);
    const player = state.players[0];
    Object.assign(player, { bossPacks: 1, bossPacksSinceHighRarity: 49 });
    player.cards = ROSTER.filter(card => card.tier === "T4").map(card => ({ characterId: card.id as never, level: 10, xp: 0 }));
    player.itemCards = CATALOG_ITEMS.filter(item => item.rarity === 3).map(item => ({ itemId: item.id, level: 10, xp: 0 }));
    const before = JSON.stringify(state);
    expect(() => applyAction(state, "a", { type: "OPEN_PACK", kind: "boss" }, 2)).toThrow("Huyền thoại");
    expect(JSON.stringify(state)).toBe(before);
  });
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
