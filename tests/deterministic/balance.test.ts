import { describe, expect, it } from "vitest";
import {
  ROSTER,
  CATALOG_ITEMS,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import { CHARACTER_BALANCE } from "../../packages/shared/src/combat-balance";
import {
  cardRarityMultiplier,
} from "../../packages/shared/src/progression";
import {
  computeStats,
  itemMultiplier,
  type Loadout,
} from "../../packages/shared/src/balance";
import {
  createBattle,
  serializeBattleState,
  restoreBattleState,
} from "../../packages/battle-engine/src/index";
import {
  characterDamage,
  characterCombat,
} from "../../packages/battle-engine/src/character-combat";

const load = (id: CharacterId, item?: string, itemLevel = 1): Loadout => ({
  characterId: id,
  classId: ROSTER.find((c) => c.id === id)!.base as Loadout["classId"],
  level: 1,
  equipment: item ? [item] : [],
  equipmentLevels: item ? { [item]: itemLevel } : {},
});
function duel(left = load("char_12"), right = load("char_01")) {
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        { id: "a", loadouts: [left] },
        { id: "b", loadouts: [right] },
      ],
    },
    77,
  );
  s.fighters.forEach((f, i) =>
    Object.assign(f, {
      x: 30000 + i * 50000,
      y: 36000,
      vx: 0,
      vy: 0,
      skillReady: 99999,
      nextAttack: 99999,
    }),
  );
  return s;
}
describe("rarity-normalized combat balance", () => {
  it("gives every character a distinct stat distribution and a functioning role", () => {
    expect(
      new Set(ROSTER.map((c) => JSON.stringify(CHARACTER_BALANCE[c.id].stats)))
        .size,
    ).toBe(25);
    expect(new Set(ROSTER.map((c) => c.stats.join(","))).size).toBe(25);
    for (const c of ROSTER) {
      const stats = computeStats(load(c.id as CharacterId));
      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.cooldown).toBeGreaterThanOrEqual(8);
      expect(stats.defense).toBeLessThanOrEqual(60);
      expect(c.skill[1]).toContain("7 giây");
    }
  });
  it("uses the same rarity budget for printed and evolved cards, including max-level GOD", () => {
    expect(cardRarityMultiplier("T1", 3)).toBe(cardRarityMultiplier("T2", 1));
    expect(cardRarityMultiplier("T1", 7)).toBe(cardRarityMultiplier("T3", 1));
    for (const base of ["T1", "T2", "T3", "T4"])
      expect(cardRarityMultiplier(base, 10)).toBe(
        cardRarityMultiplier("T1", 10),
      );
    expect(itemMultiplier("item_03", 3)).toBe(itemMultiplier("item_01", 1));
    for (const it of CATALOG_ITEMS) {
      expect(itemMultiplier(it.id, 10)).toBe(itemMultiplier("item_03", 10));
      expect(itemMultiplier(it.id, 10)).toBeGreaterThan(
        itemMultiplier(it.id, 1),
      );
    }
  });
  it("applies armor first, then consumes shield layers before HP", () => {
    const s = duel(),
      [f, t] = s.fighters;
    Object.assign(t, { hp: 200, shield: 30 });
    t.stats.defense = 20;
    t.shields = [{ amount: 30, until: 90, source: t.id }];
    expect(characterDamage(s, f, t, 100)).toBe(50);
    expect(t.hp).toBe(150);
    expect(t.shield).toBe(0);
    expect(t.shields).toHaveLength(0);
  });
  it("upgrades triggered item shields and preserves the actual item level in checkpoints", () => {
    const base = duel(load("char_12", "item_12", 1));
    const upgraded = duel(load("char_12", "item_12", 10));
    expect(upgraded.fighters[0].shield).toBeGreaterThan(
      base.fighters[0].shield,
    );
    const restored = restoreBattleState(serializeBattleState(upgraded));
    expect(restored.fighters[0].equipmentLevels?.item_12).toBe(10);
    expect(restored.fighters[0].shield).toBe(upgraded.fighters[0].shield);
  });
  it("applies burn and thorns without recursive reflection", () => {
    const s = duel(
      load("char_12", "item_25", 10),
      load("char_01", "item_24", 10),
    );
    const [f, t] = s.fighters;
    f.shield = 0;
    f.shields = [];
    const hp = f.hp;
    characterDamage(s, f, t, 10, true, 0);
    expect(f.hp).toBeLessThan(hp);
    expect(t.buffs.some((b) => b.kind === "burnDot")).toBe(true);
    const afterHit = t.hp;
    s.tick = 30;
    characterCombat(s);
    expect(t.hp).toBeLessThan(afterHit);
    expect(s.events.length).toBeLessThan(10);
  });
  it("makes superPower equipment improve the real Super damage", () => {
    const fire = (item?: string) => {
      const s = duel(load("char_12", item));
      const [f, t] = s.fighters;
      t.x = f.x + 6500;
      f.angle = 16;
      f.energy = 100;
      f.stats.rotation = 0;
      t.stats.rotation = 0;
      const hp = t.hp;
      s.tick = 1;
      characterCombat(s);
      return hp - t.hp;
    };
    expect(fire("item_08")).toBeGreaterThan(fire());
  });
});
