import { describe, expect, it, test } from "vitest";
import {
  CATALOG_ITEMS,
  character,
  FRIEND_GROUPS,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import {
  ITEM_AFFINITY,
  affinityDescription,
} from "../../packages/shared/src/affinity";
import {
  itemMultiplier,
  type Loadout,
} from "../../packages/shared/src/balance";
import {
  createBattle,
  calculateStateHash,
  serializeBattleState,
  restoreBattleState,
} from "../../packages/battle-engine/src/index";
import {
  beforeCharacterTick,
  characterCombat,
  characterDamage,
} from "../../packages/battle-engine/src/character-combat";

function fixture(itemId: string, matched = true, level = 1) {
  const it = CATALOG_ITEMS.find((it) => it.id === itemId)!;
  const id = (
    matched ? it.affinity : it.affinity === "char_04" ? "char_12" : "char_04"
  ) as CharacterId;
  const loadout: Loadout = {
    characterId: id,
    classId: character(id)!.base as Loadout["classId"],
    level: 10,
    equipment: [itemId],
    equipmentLevels: { [itemId]: level },
  };
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        { id: "a", loadouts: [loadout] },
        {
          id: "b",
          loadouts: [
            {
              characterId: "char_01",
              classId: "guardian",
              level: 10,
              equipment: [],
            },
          ],
        },
      ],
    },
    777,
  );
  s.fighters.forEach((f, i) =>
    Object.assign(f, {
      x: 50000 + i * 4000,
      y: 36000,
      vx: 0,
      vy: 0,
      nextAttack: 999999,
      skillReady: 999999,
      hp: 100000,
      shield: 0,
      shields: [],
    }),
  );
  s.fighters[0].stats.hp = s.fighters[0].baseStats.hp = 100000;
  return s;
}
function trigger(s: ReturnType<typeof fixture>, itemId: string, tick: number) {
  // Projectile lifetimes elapse between isolated affinity activation windows.
  if (tick - s.tick >= 300) s.projectiles = [];
  s.tick = tick;
  const [f, enemy] = s.fighters;
  const fx = ITEM_AFFINITY[itemId];
  f.hp = 50000;
  if (fx.trigger === "hit4")
    for (let i = 0; i < 4; i++) characterDamage(s, f, enemy, 1, true, 0);
  if (fx.trigger === "low") {
    f.hp = 100;
    characterDamage(s, enemy, f, 1, false, 0);
  }
  if (fx.trigger === "skill") {
    f.skillReady = 0;
    f.energy = 0;
    characterCombat(s);
  }
  if (fx.trigger === "super") {
    f.energy = 100;
    f.superUntil = 0;
    characterCombat(s);
  }
}

describe("all item affinity procs", () => {
  for (const it of CATALOG_ITEMS) testItem(it);
  function testItem(it: (typeof CATALOG_ITEMS)[number]) {
    test(`${it.id} adds a real, finite, level-scaled proc only on its matching character`, () => {
      expect(ITEM_AFFINITY[it.id]).toBeDefined();
      const s = fixture(it.id),
        unmatched = fixture(it.id, false),
        upgraded = fixture(it.id, true, 10);
      trigger(s, it.id, 1);
      trigger(unmatched, it.id, 1);
      trigger(upgraded, it.id, 1);
      const events = () =>
        s.events.filter((e) => e.type === `affinity:${it.id}`);
      expect(events()).toHaveLength(1);
      expect(unmatched.events.some((e) => e.type === `affinity:${it.id}`)).toBe(
        false,
      );
      expect(
        upgraded.events.find((e) => e.type === `affinity:${it.id}`)!.amount,
      ).toBeGreaterThanOrEqual(events()[0].amount);
      const fx = ITEM_AFFINITY[it.id];
      if (fx.cooldown > 1) {
        trigger(s, it.id, 2);
        expect(events()).toHaveLength(1);
      }
      for (let i = 1; i <= 8; i++)
        trigger(s, it.id, 1 + i * Math.max(360, fx.cooldown));
      expect(s.fighters[0].memory["affinity:" + it.id + ":uses"]).toBe(fx.maxUses);
      expect(
        calculateStateHash(restoreBattleState(serializeBattleState(s))),
      ).toBe(calculateStateHash(s));
      expect(
        affinityDescription(it.id, itemMultiplier(it.id, 10, true)),
      ).not.toMatch(/\{\d+\}/);
    });
  }

  it("gives every character #26–33 a real friend group", () => {
    for (let n = 26; n <= 33; n++)
      expect(
        FRIEND_GROUPS.some(
          (g) => g.members.includes(`char_${n}`) && g.members.length >= 2,
        ),
      ).toBe(true);
  });

  it("cleanses existing slow without granting permanent immunity", () => {
    const s = fixture("item_32"),
      f = s.fighters[0];
    f.buffs.push({ kind: "slow", value: 30, until: 9999, source: 1 });
    f.slowUntil = 9999;
    trigger(s, "item_32", 1);
    expect(f.buffs.some((b) => b.kind === "slow")).toBe(false);
    expect(f.memory.immuneSlow).toBeGreaterThan(1);
    s.tick = f.memory.immuneSlow + 1;
    beforeCharacterTick(s);
    expect(f.memory.immuneSlow).toBeLessThan(s.tick);
  });
});
