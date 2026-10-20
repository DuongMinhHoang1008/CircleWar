import { describe, it, expect } from "vitest";
import {
  ROSTER,
  CATALOG_ITEMS,
  BONDS,
  character,
  validChoice,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import { computeStats, type Loadout } from "../../packages/shared/src/balance";
import {
  createBattle,
  rosterConfig,
  stepBattle,
  calculateStateHash,
  restoreBattleState,
  serializeBattleState,
  runBattle,
  type BattleConfig,
} from "../../packages/battle-engine/src/index";
import {
  beforeCharacterTick,
  characterCombat,
  characterDamage,
  characterContacts,
} from "../../packages/battle-engine/src/character-combat";
const load = (id: string, equipment: string[] = []): Loadout => ({
  characterId: id as CharacterId,
  classId: character(id)!.base as Loadout["classId"],
  level: 0,
  equipment,
});
function fixture(ids: string[], equipment: string[][] = []) {
  return createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        { id: "a", loadouts: ids.map((id, i) => load(id, equipment[i])) },
        { id: "b", loadouts: [load("char_01")] },
      ],
    },
    77,
  );
}
describe("approved catalog gameplay", () => {
  it("has the complete expanded roster/item catalog and bijective affinities", () => {
    expect(ROSTER).toHaveLength(25);
    expect(CATALOG_ITEMS).toHaveLength(25);
    expect(BONDS).toHaveLength(28);
    expect(new Set(CATALOG_ITEMS.map((i) => i.affinity)).size).toBe(25);
    expect(CATALOG_ITEMS.map((item) => item.affinity)).toEqual([
      "char_09",
      "char_01",
      "char_12",
      "char_17",
      "char_02",
      "char_14",
      "char_19",
      "char_03",
      "char_16",
      "char_13",
      "char_04",
      "char_06",
      "char_10",
      "char_08",
      "char_11",
      "char_18",
      "char_07",
      "char_15",
      "char_05",
      "char_20",
      "char_21",
      "char_22",
      "char_23",
      "char_24",
      "char_25",
    ]);
    for (const c of ROSTER.slice(0, 20)) {
      expect(BONDS.some((b) => b.size === 2 && b.members.includes(c.id))).toBe(
        true,
      );
      expect(BONDS.some((b) => b.size === 3 && b.members.includes(c.id))).toBe(
        true,
      );
    }
  });
  it("applies baseline, signature affinity, weapon rank and level without modifying catalog", () => {
    const plain = computeStats(load("char_12")),
      xoi = computeStats(load("char_12", ["item_03"]));
    expect(xoi.hp - plain.hp).toBe(45);
    const wrong = computeStats(load("char_02", ["item_03"]));
    expect(wrong.hp - computeStats(load("char_02")).hp).toBe(42);
    const weapon = computeStats({
      ...load("char_12"),
      level: 6,
      weaponRank: 3,
    });
    expect(
      weapon.attack - computeStats({ ...load("char_12"), level: 6 }).attack,
    ).toBe(4);
    expect(weapon.superPower).toBe(110);
  });
  it("fires each of 19 unique supers and each automatic skill", () => {
    for (const c of ROSTER) {
      const s = fixture([c.id]),
        f = s.fighters[0],
        enemy = s.fighters[1];
      Object.assign(f, { x: 60000, y: 36000 });
      Object.assign(enemy, { x: 65000, y: 36000 });
      f.energy = 100;
      s.tick = 1;
      beforeCharacterTick(s);
      characterCombat(s);
      expect(f.supers, c.id).toBe(1);
      expect(
        s.events.some((e) => e.type === "super" && e.source === f.id),
      ).toBe(true);
      f.skillReady = 0;
      s.tick = 2;
      beforeCharacterTick(s);
      characterCombat(s);
      expect(
        s.events.some(
          (e) => e.type === `skill:${c.id.slice(-2)}` && e.source === f.id,
        ),
        c.id,
      ).toBe(true);
    }
  });
  it("tank Super and skill apply armor percentage and grant finite shields", () => {
    const s = fixture(["char_01"]),
      f = s.fighters[0];
    const enemy = s.fighters[1],
      startingHp = enemy.hp;
    Object.assign(f, { x: 60000, y: 36000 });
    Object.assign(enemy, { x: 65000, y: 36000 });
    f.baseStats.rotation = enemy.baseStats.rotation = 0;
    f.angle = 16;
    enemy.angle = 0;
    f.energy = 100;
    s.tick = 1;
    beforeCharacterTick(s);
    characterCombat(s);
    expect(startingHp - enemy.hp).toBe(
      Math.floor(
        (Math.floor(f.stats.attack * 1.5) * (100 - enemy.stats.defense)) / 100,
      ),
    );
    expect(f.shield).toBe(Math.floor((f.stats.hp * 12) / 100));
    const hpBeforeSkill = enemy.hp;
    f.skillReady = 0;
    s.tick = 2;
    beforeCharacterTick(s);
    characterCombat(s);
    expect(hpBeforeSkill - enemy.hp).toBe(
      Math.floor(
        (Math.floor(f.stats.attack * 1.1) * (100 - enemy.stats.defense)) / 100,
      ),
    );
  });
  it("expires shields, has finite low-HP protection, and cannot revive a lethal hit", () => {
    const s = fixture(["char_01"], [["item_02"]]),
      f = s.fighters[0],
      enemy = s.fighters[1];
    characterDamage(s, enemy, f, 230);
    expect(f.memory.bedding).toBe(1);
    expect(f.shield).toBe(36);
    s.tick = 91;
    beforeCharacterTick(s);
    expect(f.shield).toBe(0);
    characterDamage(s, enemy, f, 20);
    expect(f.shield).toBe(0);
    const lethal = fixture(["char_01"], [["item_02", "item_17"]]);
    lethal.fighters[0].hp = 2;
    characterDamage(lethal, lethal.fighters[1], lethal.fighters[0], 300);
    expect(lethal.fighters[0].hp).toBe(0);
    expect(lethal.fighters[0].shield).toBe(0);
  });
  it("limits clock energy, milk healing and per-tick charge", () => {
    const s = fixture(["char_09"], [["item_01", "item_19"]]),
      f = s.fighters[0];
    f.hp -= 50;
    for (const tick of [150, 300, 450, 600]) {
      s.tick = tick;
      beforeCharacterTick(s);
      characterCombat(s);
    }
    expect(f.hp).toBe(f.stats.hp - 34);
    expect(f.energy).toBe(12);
    s.tick = 2100;
    beforeCharacterTick(s);
    characterCombat(s);
    expect(f.energy).toBe(12);
  });
  it("magazine contact cannot proc three times in solver passes and herb clears slow", () => {
    const s = fixture(["char_04"], [["item_11"]]),
      [f, t] = s.fighters;
    Object.assign(f, { x: 60000, y: 36000 });
    Object.assign(t, { x: 63000, y: 36000 });
    for (let pass = 0; pass < 3; pass++) characterContacts(s, f, t);
    expect(s.events.filter((e) => e.type === "item:11")).toHaveLength(1);
    expect(t.slowUntil).toBe(30);
    const protectedState = fixture(["char_04"], [["item_11"]]);
    const [a, b] = protectedState.fighters;
    b.equipment = ["item_15"];
    Object.assign(a, { x: 60000, y: 36000 });
    Object.assign(b, { x: 63000, y: 36000 });
    characterContacts(protectedState, a, b);
    expect(b.slowUntil).toBe(0);
    expect(b.memory.herb).toBe(1);
  });
  it("resolves a trio on its own trigger and stops when a member dies", () => {
    const config: BattleConfig = {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        {
          id: "a",
          loadouts: ["char_01", "char_08", "char_15"].map((id) => load(id)),
          choice: { trait: "Thú Nhân", bond: "T01" },
        },
        { id: "b", loadouts: [load("char_09")] },
      ],
    };
    const s = createBattle(config, 1);
    s.fighters.forEach((f, i) =>
      Object.assign(f, { x: 50000 + i * 4000, y: 36000 }),
    );
    s.fighters[2].energy = 100;
    s.tick = 1;
    beforeCharacterTick(s);
    characterCombat(s);
    expect(s.bonds["a:T01"].uses).toBe(1);
    expect(s.events.some((e) => e.type === "bond:T01")).toBe(true);
    expect(s.events.some((e) => e.type === "bond:P01")).toBe(false);
    s.fighters[0].hp = 0;
    s.tick = 400;
    s.fighters[2].superUntil = 0;
    s.fighters[2].energy = 100;
    beforeCharacterTick(s);
    characterCombat(s);
    expect(s.bonds["a:T01"].uses).toBe(1);
    expect(
      validChoice([load("char_01"), load("char_01"), load("char_01")], {
        trait: "Thú Nhân",
      }),
    ).toBe(false);
  });
  it("preserves new skills/items and bounded state across JSON checkpoints and reset", () => {
    const config = rosterConfig(60);
    config.teams.forEach((t, i) =>
      t.loadouts.forEach((l, j) => {
        l.equipment = [CATALOG_ITEMS[(i * 3 + j) % 20].id];
      }),
    );
    const a = createBattle(config, 41);
    let b = createBattle(config, 41);
    for (let n = 0; n < 500 && !a.finished; n++) {
      stepBattle(a);
      stepBattle(b);
      if (n % 37 === 0) b = restoreBattleState(serializeBattleState(b));
    }
    expect(calculateStateHash(a)).toBe(calculateStateHash(b));
    expect(a.zones.length).toBeLessThanOrEqual(180);
    expect(a.projectiles.length).toBeLessThanOrEqual(240);
    for (const f of a.fighters)
      expect(
        [f.hp, f.x, f.y, ...Object.values(f.stats)].every(Number.isSafeInteger),
      ).toBe(true);
    const fresh = createBattle(config, 41);
    expect(
      fresh.fighters.every((f) => !f.hits && f.energy === 0 && f.supers === 0),
    ).toBe(true);
  });
  it("each of 12 pairs and 8 trios triggers its actual defined event", () => {
    const actors: Record<string, number> = {
      P01: 1,
      P02: 2,
      P03: 13,
      P04: 10,
      P05: 5,
      P06: 6,
      P07: 9,
      P08: 15,
      P09: 17,
      P10: 19,
      P11: 18,
      P12: 11,
      P13: 20,
      T01: 15,
      T02: 7,
      T03: 18,
      T04: 9,
      T05: 6,
      T06: 19,
      T07: 10,
      T08: 12,
      T09: 20,
      P14: 21,
      P15: 22,
      P16: 24,
      P17: 21,
      P18: 22,
      T10: 21,
    };
    for (const b of BONDS) {
      const config: BattleConfig = {
        width: 120000,
        height: 72000,
        shrinkSeconds: 60,
        teams: [
          {
            id: "a",
            loadouts: b.members.map((id) => load(id)),
            choice: { bond: b.id },
          },
          { id: "b", loadouts: [load("char_01")] },
        ],
      };
      const s = createBattle(config, 33),
        group = s.fighters.filter((f) => f.team === "a"),
        actor = group.find(
          (f) => Number(f.characterId!.slice(-2)) === actors[b.id],
        )!,
        enemy = s.fighters.at(-1)!;
      group.forEach((f, i) => {
        f.x = 50000 + i * 1000;
        f.y = 36000;
      });
      enemy.x = actor.x + 3000;
      enemy.y = 36000;
      for (const id of [
        "char_03",
        "char_12",
        "char_13",
        "char_17",
        "char_19",
      ]) {
        const t = group.find((f) => f.characterId === id);
        if (t && t !== actor) t.hp = 50;
      }
      s.tick = 1;
      beforeCharacterTick(s);
      actor.skillReady = 0;
      if (b.size === 3) actor.energy = 100;
      if (b.size === 3 || Number(b.id.slice(1)) >= 14) actor.energy = 100;
      else actor.skillReady = 0;
      characterCombat(s);
      expect(
        s.events.some((e) => e.type === "bond:" + b.id),
        b.id,
      ).toBe(true);
      expect(s.bonds[`a:${b.id}`].uses, b.id).toBe(1);
    }
  });
  it("finishes repeated full-roster battles deterministically", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const config = rosterConfig(seed % 3 === 0 ? 60 : 20);
      config.shrinkSeconds = 10;
      const a = runBattle(config, seed),
        b = runBattle(config, seed);
      expect(calculateStateHash(a)).toBe(calculateStateHash(b));
      expect(a.tick).toBeLessThan(30000);
    }
  });
});
