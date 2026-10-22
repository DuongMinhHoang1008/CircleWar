import { describe, expect, it } from "vitest";
import {
  ROSTER,
  character,
  type CharacterId,
} from "../../packages/shared/src/catalog";
import {
  CHARACTER_PASSIVES,
  LEGENDARY_KITS,
} from "../../packages/shared/src/character-abilities";
import { CHARACTER_BALANCE } from "../../packages/shared/src/combat-balance";
import {
  createBattle,
  stepBattle,
  calculateStateHash,
  serializeBattleState,
  restoreBattleState,
} from "../../packages/battle-engine/src/index";
import {
  characterCombat,
  characterContacts,
  characterDamage,
  characterWall,
  beforeCharacterTick,
} from "../../packages/battle-engine/src/character-combat";
import type { Loadout } from "../../packages/shared/src/balance";

const load = (id: CharacterId): Loadout => ({
  characterId: id,
  classId: character(id)!.base as Loadout["classId"],
  level: 10,
  equipment: [],
});
function fixture(id: CharacterId, ally: CharacterId = "char_04") {
  const s = createBattle(
    {
      width: 120000,
      height: 72000,
      shrinkSeconds: 60,
      teams: [
        { id: "a", loadouts: [load(id), load(ally === id ? "char_01" : ally)] },
        { id: "b", loadouts: [load("char_05")] },
      ],
    },
    777,
  );
  s.fighters.forEach((f, i) => {
    Object.assign(f, {
      x: 50000 + i * 2000,
      y: 36000,
      vx: 0,
      vy: 0,
      nextAttack: 999999,
      skillReady: 999999,
    });
    f.baseStats.rotation = f.stats.rotation = 0;
    f.cooldowns = Object.fromEntries(
      s.fighters.map((t) => [`0:${t.id}`, 999999]),
    );
  });
  const [f, friend, enemy] = s.fighters;
  f.hp = Math.floor(f.stats.hp * 0.7);
  friend.hp = Math.floor(friend.stats.hp * 0.5);
  enemy.stats.hp = enemy.baseStats.hp = enemy.hp = 10000;
  s.tick = 1;
  return s;
}

describe("individual identities for every old and new card", () => {
  it("defines 33 distinct mechanical identities and descriptions instead of class templates", () => {
    expect(Object.keys(CHARACTER_PASSIVES)).toHaveLength(33);
    expect(new Set(ROSTER.map((c) => c.passive[1])).size).toBe(33);
    const signatures = ROSTER.map((c) => {
      const p = CHARACTER_PASSIVES[c.id];
      return JSON.stringify([p.trigger, p.effect, p.every, p.condition]);
    });
    expect(new Set(signatures).size).toBe(33);
    for (const c of ROSTER)
      expect(c.passive[1]).not.toMatch(/\{\w+\}|Giá trị gốc/);
  });

  for (const c of ROSTER)
    it(`${c.id} triggers its real identity and preserves proc state in checkpoints`, () => {
      const s = fixture(c.id as CharacterId),
        [f, ally, enemy] = s.fighters;
      const p = CHARACTER_PASSIVES[c.id];
      if (p.condition === "slowed" || p.condition === "debuffed") {
        enemy.slowUntil = 9999;
        enemy.buffs.push({
          kind: "slow",
          value: 15,
          until: 9999,
          source: f.id,
        });
      }
      if (p.condition === "targetLow") enemy.hp = 2000;
      if (p.effect === "energy") enemy.x = f.x + p.range * 100 + 100;
      if (p.trigger === "hit")
        for (let i = 0; i < p.every; i++)
          characterDamage(s, f, enemy, 12, true, 0);
      if (p.trigger === "taken")
        for (let i = 0; i < p.every; i++)
          characterDamage(s, enemy, f, 3, true, 0);
      if (p.trigger === "skill") {
        f.skillReady = 0;
        characterCombat(s);
      }
      if (p.trigger === "super") {
        f.energy = 100;
        characterCombat(s);
      }
      if (p.trigger === "wall") characterWall(s, f);
      if (p.trigger === "contact") {
        enemy.x = f.x + 2000;
        characterContacts(s, f, enemy);
      }
      if (p.trigger === "low") {
        f.hp = Math.floor(f.stats.hp * 0.3);
        characterDamage(s, enemy, f, 1);
      }
      if (p.trigger === "allyLow") {
        ally.hp = Math.floor(ally.stats.hp * 0.3);
        characterDamage(s, enemy, ally, 1);
      }
      if (p.trigger === "kill") {
        enemy.hp = 1;
        characterDamage(s, f, enemy, 20);
      }
      if (p.trigger === "pulse") {
        if (p.condition === "ownZone") {
          f.skillReady = 0;
          characterCombat(s);
          f.x = enemy.x;
          f.y = enemy.y;
        }
        s.tick = p.condition === "ownZone" ? 30 : Math.max(p.cooldown, 30);
        beforeCharacterTick(s);
      }
      expect(
        s.events.some((e) => e.type === `passive:${c.id}` && e.source === f.id),
        c.id,
      ).toBe(true);
      expect(f.memory.passiveUses).toBeGreaterThan(0);
      expect(
        calculateStateHash(restoreBattleState(serializeBattleState(s))),
      ).toBe(calculateStateHash(s));
    });

  it("does not manufacture wall passives from normal hits and caps repeated wall procs", () => {
    const s = fixture("char_04"),
      [f, , enemy] = s.fighters;
    for (let i = 0; i < 12; i++) characterDamage(s, f, enemy, 1, true, 0);
    expect(s.events.some((e) => e.type === "passive:char_04")).toBe(false);
    for (let i = 0; i < 12; i++) {
      s.tick = i * 180 + 1;
      characterWall(s, f);
      characterWall(s, f);
    }
    expect(s.events.filter((e) => e.type === "passive:char_04")).toHaveLength(
      CHARACTER_PASSIVES.char_04.maxUses,
    );
  });

  it("lifesteal uses actual HP damage and cannot heal from shield-only hits", () => {
    const s = fixture("char_08"),
      [f, , enemy] = s.fighters;
    enemy.shield = 100;
    enemy.shields = [{ amount: 100, until: 999, source: enemy.id }];
    const hp = f.hp;
    for (let i = 0; i < 4; i++) characterDamage(s, f, enemy, 1, true, 0);
    expect(f.hp).toBe(hp);
    s.tick = 200;
    enemy.shield = 0;
    enemy.shields = [];
    for (let i = 0; i < 4; i++) characterDamage(s, f, enemy, 12, true, 0);
    expect(f.hp).toBeGreaterThan(hp);
  });
});

describe("legendary roles have concrete, counterable mechanics", () => {
  it("assigns the requested five roles", () => {
    expect(
      ["char_22", "char_23", "char_31", "char_32", "char_33"].map(
        (id) => CHARACTER_BALANCE[id].role,
      ),
    ).toEqual(["support", "fighter", "ranger", "controller", "tank"]);
    expect(character("char_31")!.roleClass).toBe("Xạ thủ");
  });
  it("Aura buffs nearby teammates, follows them by distance, and stops on death", () => {
    const s = fixture("char_22"),
      [aura, ally] = s.fighters;
    beforeCharacterTick(s);
    const near = ally.stats.attack;
    ally.x = aura.x + 20000;
    s.tick++;
    beforeCharacterTick(s);
    expect(ally.stats.attack).toBeLessThan(near);
    ally.x = aura.x + 2000;
    aura.hp = 0;
    s.tick++;
    beforeCharacterTick(s);
    expect(ally.stats.attack).toBeLessThan(near);
  });
  it("King hits a target inside expanded reach and returns to base reach after expiry", () => {
    const s = fixture("char_23"),
      [f, , enemy] = s.fighters;
    enemy.x = f.x + f.stats.reach + enemy.radius + 600;
    const oldReach = f.stats.reach,
      hp = enemy.hp;
    f.skillReady = 0;
    characterCombat(s);
    expect(enemy.hp).toBeLessThan(hp);
    expect(f.stats.reach).toBe(oldReach + LEGENDARY_KITS.char_23.skillReach);
    s.tick = 100;
    beforeCharacterTick(s);
    expect(f.stats.reach).toBe(oldReach);
    enemy.x = f.x + 20000;
    f.energy = 100;
    characterCombat(s);
    expect(f.energy).toBe(100); // No target: no energy spent.
  });
  it("radiation needs a hit, caps at three stacks across duplicate sources, reduces healing and expires", () => {
    const s = createBattle(
      {
        width: 120000,
        height: 72000,
        shrinkSeconds: 60,
        teams: [
          { id: "a", loadouts: [load("char_31"), load("char_31")] },
          { id: "b", loadouts: [load("char_33")] },
        ],
      },
      73,
    );
    const [a, b, victim] = s.fighters;
    s.fighters.forEach((f, i) => {
      Object.assign(f, {
        x: 50000 + i * 3000,
        y: 36000,
        nextAttack: 99999,
        skillReady: 99999,
      });
      f.cooldowns = { "0:0": 99999, "0:1": 99999, "0:2": 99999 };
    });
    s.tick = 1;
    for (const source of [a, b])
      for (let i = 0; i < 4; i++)
        characterDamage(s, source, victim, 1, true, 0);
    expect(
      victim.buffs
        .filter((b) => b.kind === "radiation")
        .reduce((sum, b) => sum + b.value, 0),
    ).toBe(3);
    victim.hp -= 100;
    victim.skillReady = 0;
    const hp = victim.hp;
    characterCombat(s);
    const healed = victim.hp - hp;
    expect(healed).toBeGreaterThan(0);
    expect(healed).toBeLessThan(Math.floor(victim.stats.hp * 0.03));
    const beforeDot = victim.hp;
    s.tick = 30;
    characterCombat(s);
    expect(victim.hp).toBeLessThan(beforeDot);
    s.tick = 100;
    beforeCharacterTick(s);
    expect(victim.buffs.some((b) => b.kind === "radiation")).toBe(false);
  });
  it("Bang Chu's territory waits for its telegraph and cannot hit outside its fixed radius", () => {
    const s = fixture("char_32"),
      [f, , enemy] = s.fighters;
    f.skillReady = 0;
    characterCombat(s);
    const z = s.zones.find((z) => z.territory)!;
    expect(z).toBeDefined();
    const hp = enemy.hp;
    s.tick = z.start! - 1;
    characterCombat(s);
    expect(enemy.hp).toBe(hp);
    s.tick = z.start! + 30;
    characterCombat(s);
    expect(enemy.hp).toBeLessThan(hp);
    const after = enemy.hp;
    enemy.x = z.x + (z.radius! + 50) * 100;
    s.tick += 30;
    characterCombat(s);
    expect(enemy.hp).toBe(after);
    f.energy = 100;
    enemy.x = z.x;
    characterCombat(s);
    expect(s.zones.filter((z) => z.territory && z.owner === f.id)).toHaveLength(
      1,
    );
  });
  it("Jake heals an injured ally without an enemy but never revives a dead ally", () => {
    const s = fixture("char_33"),
      [f, ally, enemy] = s.fighters;
    enemy.x = 110000;
    const hp = ally.hp;
    f.skillReady = 0;
    characterCombat(s);
    expect(ally.hp).toBeGreaterThan(hp);
    ally.hp = 0;
    f.skillReady = 0;
    characterCombat(s);
    expect(ally.hp).toBe(0);
  });
});
